const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use /tmp for serverless environment
const DB_PATH = path.join('/tmp', 'prompt_tester.db');

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
        -- Users table for authentication
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Questions table
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'text',
          required INTEGER DEFAULT 0,
          hardFilter INTEGER DEFAULT 0,
          options TEXT,
          tags TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Prompts table with versioning support
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          base_prompt_id TEXT,
          version INTEGER DEFAULT 1,
          questions TEXT NOT NULL,
          answers TEXT NOT NULL,
          generated_prompt TEXT NOT NULL,
          tags TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (base_prompt_id) REFERENCES prompts(id)
        );

        -- Test Results table with enhanced analytics
        CREATE TABLE IF NOT EXISTS test_results (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL,
          prompt_name TEXT NOT NULL,
          prompt_version INTEGER DEFAULT 1,
          json_data TEXT NOT NULL,
          json_type TEXT DEFAULT 'json',
          result_summary TEXT NOT NULL,
          result_insights TEXT,
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
      `;

      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables created successfully');
          resolve();
        }
      });
    });
  }

  // User methods
  async createUser(user) {
    return new Promise((resolve, reject) => {
      const { id, email, password, name, role = 'user' } = user;
      this.db.run(
        'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
        [id, email, password, name, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id, email, name, role });
        }
      );
    });
  }

  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Questions methods
  async getAllQuestions() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM questions ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createQuestion(question) {
    return new Promise((resolve, reject) => {
      const { id, text, type, required, hardFilter, options, tags } = question;
      this.db.run(
        'INSERT INTO questions (id, text, type, required, hardFilter, options, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, text, type, required, hardFilter, JSON.stringify(options), JSON.stringify(tags)],
        function(err) {
          if (err) reject(err);
          else resolve({ id, text, type, required, hardFilter, options, tags });
        }
      );
    });
  }

  async updateQuestion(id, question) {
    return new Promise((resolve, reject) => {
      const { text, type, required, hardFilter, options, tags } = question;
      this.db.run(
        'UPDATE questions SET text = ?, type = ?, required = ?, hardFilter = ?, options = ?, tags = ? WHERE id = ?',
        [text, type, required, hardFilter, JSON.stringify(options), JSON.stringify(tags), id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...question });
        }
      );
    });
  }

  async deleteQuestion(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM questions WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  // Prompts methods
  async getAllPrompts() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM prompts ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            questions: JSON.parse(row.questions),
            answers: JSON.parse(row.answers),
            tags: JSON.parse(row.tags)
          })));
        }
      );
    });
  }

  async createPrompt(prompt) {
    return new Promise((resolve, reject) => {
      const { id, name, base_prompt_id, version, questions, answers, generated_prompt, tags } = prompt;
      this.db.run(
        'INSERT INTO prompts (id, name, base_prompt_id, version, questions, answers, generated_prompt, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, base_prompt_id, version, JSON.stringify(questions), JSON.stringify(answers), generated_prompt, JSON.stringify(tags)],
        function(err) {
          if (err) reject(err);
          else resolve({ id, name, ...prompt });
        }
      );
    });
  }

  async getPrompt(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM prompts WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else if (row) {
            resolve({
              ...row,
              questions: JSON.parse(row.questions),
              answers: JSON.parse(row.answers),
              tags: JSON.parse(row.tags)
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async deletePrompt(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM prompts WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  // Test Results methods
  async getAllTestResults() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM test_results ORDER BY timestamp DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createTestResult(result) {
    return new Promise((resolve, reject) => {
      const {
        id, prompt_id, prompt_name, prompt_version, json_data, json_type,
        result_summary, result_insights, confidence, processing_time,
        chatgpt_response, model, tokens_used, cost_usd, success, error_message
      } = result;
      
      this.db.run(
        `INSERT INTO test_results (
          id, prompt_id, prompt_name, prompt_version, json_data, json_type,
          result_summary, result_insights, confidence, processing_time,
          chatgpt_response, model, tokens_used, cost_usd, success, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, prompt_id, prompt_name, prompt_version, json_data, json_type,
          result_summary, JSON.stringify(result_insights), confidence, processing_time,
          chatgpt_response, model, tokens_used, cost_usd, success, error_message
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...result });
        }
      );
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
