const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'prompt_tester.db');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');

      // Create tables
      const createTables = `
        -- Questions table
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'text',
          required INTEGER DEFAULT 0,
          hardFilter INTEGER DEFAULT 0,
          options TEXT, -- JSON array for select/multiselect options
          tags TEXT DEFAULT '[]', -- JSON array of tags
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Prompts table with versioning support
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          base_prompt_id TEXT, -- For versioning: references the original prompt
          version INTEGER DEFAULT 1,
          questions TEXT NOT NULL, -- JSON array
          answers TEXT NOT NULL, -- JSON object
          generated_prompt TEXT NOT NULL,
          tags TEXT DEFAULT '[]', -- JSON array of tags
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (base_prompt_id) REFERENCES prompts(id)
        );

        -- Test Results table with enhanced analytics
        CREATE TABLE IF NOT EXISTS test_results (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          prompt_name TEXT NOT NULL,
          prompt_version INTEGER DEFAULT 1,
          json_data TEXT NOT NULL, -- JSON data
          json_type TEXT DEFAULT 'json',
          result_summary TEXT NOT NULL,
          result_insights TEXT, -- JSON array
          confidence REAL DEFAULT 0.0,
          processing_time INTEGER DEFAULT 0,
          chatgpt_response TEXT,
          model TEXT,
          tokens_used INTEGER DEFAULT 0,
          cost_usd REAL DEFAULT 0.0,
          success INTEGER DEFAULT 1,
          error_message TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id)
        );

        -- Analytics table for aggregated metrics
        CREATE TABLE IF NOT EXISTS prompt_analytics (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          date DATE NOT NULL,
          total_tests INTEGER DEFAULT 0,
          avg_confidence REAL DEFAULT 0.0,
          avg_processing_time INTEGER DEFAULT 0,
          success_rate REAL DEFAULT 0.0,
          total_tokens INTEGER DEFAULT 0,
          total_cost REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id),
          UNIQUE(prompt_id, date)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_prompts_base_id ON prompts(base_prompt_id);
        CREATE INDEX IF NOT EXISTS idx_test_results_prompt_id ON test_results(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
        CREATE INDEX IF NOT EXISTS idx_prompt_analytics_prompt_date ON prompt_analytics(prompt_id, date);
      `;

      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables initialized successfully');
          
          // Add tags column to existing prompts table if it doesn't exist
          this.db.run('ALTER TABLE prompts ADD COLUMN tags TEXT DEFAULT \'[]\'', (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
              console.log('Tags column already exists or failed to add:', alterErr.message);
            } else {
              console.log('Tags column check completed');
            }
            
            // Add tags column to existing questions table if it doesn't exist
            this.db.run('ALTER TABLE questions ADD COLUMN tags TEXT DEFAULT \'[]\'', (questionAlterErr) => {
              if (questionAlterErr && !questionAlterErr.message.includes('duplicate column name')) {
                console.log('Questions tags column already exists or failed to add:', questionAlterErr.message);
              } else {
                console.log('Questions tags column check completed');
              }
              
              // Add hardFilter column to existing questions table if it doesn't exist
              this.db.run('ALTER TABLE questions ADD COLUMN hardFilter INTEGER DEFAULT 0', (hardFilterAlterErr) => {
                if (hardFilterAlterErr && !hardFilterAlterErr.message.includes('duplicate column name')) {
                  console.log('Questions hardFilter column already exists or failed to add:', hardFilterAlterErr.message);
                } else {
                  console.log('Questions hardFilter column check completed');
                }
                resolve();
              });
            });
          });
        }
      });
    });
  }

  // Questions operations
  async getAllQuestions() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM questions ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => {
          try {
            return {
              ...row,
              options: row.options ? JSON.parse(row.options) : [],
              tags: JSON.parse(row.tags || '[]'),
              hardFilter: Boolean(row.hardFilter)
            };
          } catch (parseError) {
            console.error('Error parsing question data:', row.id, parseError);
            return {
              ...row,
              options: row.options ? JSON.parse(row.options) : [],
              tags: [],
              hardFilter: false
            };
          }
        }));
      });
    });
  }

  async createQuestion(question) {
    return new Promise((resolve, reject) => {
      const { id, text, type, required, hardFilter, options, tags = [] } = question;
      this.db.run(
        'INSERT INTO questions (id, text, type, required, hardFilter, options, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          text,
          type || 'text',
          required || 0,
          hardFilter || 0,
          JSON.stringify(options || []),
          JSON.stringify(tags)
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ 
            id, 
            text, 
            type: type || 'text',
            required: required || 0,
            hardFilter: hardFilter || 0,
            options: options || [],
            tags
          });
        }
      );
    });
  }

  async updateQuestion(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        if (key === 'options') {
          fields.push(`${key} = ?`);
          values.push(updates[key] ? JSON.stringify(updates[key]) : null);
        } else if (key === 'required' || key === 'hardFilter') {
          fields.push(`${key} = ?`);
          values.push(updates[key] ? 1 : 0);
        } else if (key === 'tags') {
          fields.push(`${key} = ?`);
          values.push(updates[key] ? JSON.stringify(updates[key]) : JSON.stringify([]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      
      values.push(id);
      
      this.db.run(
        `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...updates });
        }
      );
    });
  }

  async deleteQuestion(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Prompts operations
  async getAllPrompts() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT p.*, 
               COUNT(tr.id) as test_count,
               MAX(tr.timestamp) as last_test
        FROM prompts p
        LEFT JOIN test_results tr ON p.id = tr.prompt_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          questions: JSON.parse(row.questions),
          answers: JSON.parse(row.answers),
          generatedPrompt: row.generated_prompt, // Map generated_prompt to generatedPrompt
          tags: JSON.parse(row.tags || '[]'), // Parse tags from JSON
          test_count: row.test_count || 0
        })));
      });
    });
  }

  async createPrompt(prompt) {
    return new Promise((resolve, reject) => {
      const { id, name, questions, answers, generatedPrompt, tags = [] } = prompt;
      
      // Check if this is a version of an existing prompt
      this.db.get(
        'SELECT id, version FROM prompts WHERE name = ? ORDER BY version DESC LIMIT 1',
        [name],
        (err, existingPrompt) => {
          if (err) {
            reject(err);
            return;
          }

          const basePromptId = existingPrompt ? existingPrompt.id : null;
          const version = existingPrompt ? existingPrompt.version + 1 : 1;

          this.db.run(
            'INSERT INTO prompts (id, name, base_prompt_id, version, questions, answers, generated_prompt, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              id,
              name,
              basePromptId,
              version,
              JSON.stringify(questions),
              JSON.stringify(answers),
              generatedPrompt,
              JSON.stringify(tags)
            ],
            function(err) {
              if (err) reject(err);
              else resolve({ 
                id, 
                name, 
                questions, 
                answers, 
                generatedPrompt,
                tags,
                version,
                basePromptId
              });
            }
          );
        }
      );
    });
  }

  async getPrompt(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM prompts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            ...row,
            questions: JSON.parse(row.questions),
            answers: JSON.parse(row.answers),
            generatedPrompt: row.generated_prompt, // Map generated_prompt to generatedPrompt
            tags: JSON.parse(row.tags || '[]') // Parse tags from JSON
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async deletePrompt(id) {
    return new Promise((resolve, reject) => {
      // First delete associated test results
      this.db.run('DELETE FROM test_results WHERE prompt_id = ?', [id], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Then delete the prompt
        this.db.run('DELETE FROM prompts WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        });
      });
    });
  }

  // Test Results operations
  async getAllTestResults() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT tr.*, p.name as prompt_name, p.version as prompt_version
        FROM test_results tr
        JOIN prompts p ON tr.prompt_id = p.id
        ORDER BY tr.timestamp DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          jsonData: JSON.parse(row.json_data),
          result: {
            summary: row.result_summary,
            insights: row.result_insights ? JSON.parse(row.result_insights) : [],
            confidence: row.confidence,
            processingTime: row.processing_time,
            chatGPTResponse: row.chatgpt_response,
            model: row.model,
            tokensUsed: row.tokens_used,
            costUsd: row.cost_usd
          },
          tokensUsed: row.tokens_used,
          costUsd: row.cost_usd
        })));
      });
    });
  }

  async createTestResult(testResult) {
    return new Promise((resolve, reject) => {
      const {
        id,
        promptId,
        promptName,
        promptVersion = 1,
        jsonData,
        result,
        tokensUsed = 0,
        costUsd = 0,
        timestamp
      } = testResult;

      this.db.run(
        `INSERT INTO test_results (
          id, prompt_id, prompt_name, prompt_version, json_data, json_type,
          result_summary, result_insights, confidence, processing_time,
          chatgpt_response, model, tokens_used, cost_usd, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          promptId,
          promptName,
          promptVersion,
          JSON.stringify(jsonData),
          jsonData.type || 'json',
          result.summary,
          JSON.stringify(result.insights || []),
          result.confidence,
          result.processingTime,
          result.chatGPTResponse,
          result.model,
          tokensUsed,
          costUsd,
          timestamp || new Date().toISOString()
        ],
        function(err) {
          if (err) reject(err);
          else resolve(testResult);
        }
      );
    });
  }

  async getTestResultsForPrompt(promptId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM test_results WHERE prompt_id = ? ORDER BY timestamp DESC',
        [promptId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            jsonData: JSON.parse(row.json_data),
            result: {
              summary: row.result_summary,
              insights: row.result_insights ? JSON.parse(row.result_insights) : [],
              confidence: row.confidence,
              processingTime: row.processing_time,
              chatGPTResponse: row.chatgpt_response,
              model: row.model
            }
          })));
        }
      );
    });
  }

  // Analytics operations
  async getPromptAnalytics(promptId, startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as total_tests,
          AVG(confidence) as avg_confidence,
          AVG(processing_time) as avg_processing_time,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
          SUM(tokens_used) as total_tokens,
          SUM(cost_usd) as total_cost
        FROM test_results 
        WHERE prompt_id = ?
      `;
      const params = [promptId];

      if (startDate) {
        query += ' AND DATE(timestamp) >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND DATE(timestamp) <= ?';
        params.push(endDate);
      }

      query += ' GROUP BY DATE(timestamp) ORDER BY date DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getOverallAnalytics() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          p.id as prompt_id,
          p.name as prompt_name,
          p.version,
          COUNT(tr.id) as total_tests,
          AVG(tr.confidence) as avg_confidence,
          AVG(tr.processing_time) as avg_processing_time,
          SUM(CASE WHEN tr.success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(tr.id) as success_rate,
          MAX(tr.timestamp) as last_test,
          SUM(tr.tokens_used) as total_tokens,
          SUM(tr.cost_usd) as total_cost
        FROM prompts p
        LEFT JOIN test_results tr ON p.id = tr.prompt_id
        GROUP BY p.id, p.name, p.version
        ORDER BY total_tests DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Prompt versioning methods
  async getPromptVersions(name) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM prompts WHERE name = ? ORDER BY version DESC',
        [name],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            questions: JSON.parse(row.questions),
            answers: JSON.parse(row.answers)
          })));
        }
      );
    });
  }

  async clonePrompt(originalId, newName) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM prompts WHERE id = ?', [originalId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Original prompt not found'));
          return;
        }

        const clonedPrompt = {
          id: require('uuid').v4(),
          name: newName || `${row.name} (Copy)`,
          base_prompt_id: row.id,
          version: 1,
          questions: row.questions,
          answers: row.answers,
          generated_prompt: row.generated_prompt
        };

        this.db.run(
          'INSERT INTO prompts (id, name, base_prompt_id, version, questions, answers, generated_prompt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            clonedPrompt.id,
            clonedPrompt.name,
            clonedPrompt.base_prompt_id,
            clonedPrompt.version,
            clonedPrompt.questions,
            clonedPrompt.answers,
            clonedPrompt.generated_prompt
          ],
          function(err) {
            if (err) reject(err);
            else resolve({
              ...clonedPrompt,
              questions: JSON.parse(clonedPrompt.questions),
              answers: JSON.parse(clonedPrompt.answers)
            });
          }
        );
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
