const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import OpenAI
const OpenAI = require('openai');

// Import Database
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-actual-openai-api-key-here')) {
  console.warn('⚠️  WARNING: OpenAI API key is not configured!');
  console.warn('Please set your actual OpenAI API key in the .env file');
  console.warn('ChatGPT testing will not work without a valid API key');
} else {
  console.log('✅ OpenAI API key is configured');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase payload limit to 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB file size limit
  }
});

// Legacy in-memory storage (will be migrated to database)
let questions = [];
let prompts = [];
let testResults = [];

// Initialize database and migrate data
async function initializeServer() {
  try {
    await database.connect();
    await database.initialize();
    
    console.log('🗄️  Database initialized successfully');
    
    // TODO: Migration logic here if needed
    // For now, we'll start fresh with the database
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

// Questions endpoints
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await database.getAllQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const question = {
      id: uuidv4(),
      text: req.body.text,
      type: req.body.type || 'text',
      required: req.body.required || false,
      options: req.body.options
    };
    
    const createdQuestion = await database.createQuestion(question);
    res.json(createdQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  try {
    const updatedQuestion = await database.updateQuestion(req.params.id, req.body);
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    await database.deleteQuestion(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Prompts endpoints
app.get('/api/prompts', async (req, res) => {
  try {
    const prompts = await database.getAllPrompts();
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

app.post('/api/prompts', async (req, res) => {
  try {
    const prompt = {
      id: uuidv4(),
      name: req.body.name,
      questions: req.body.questions,
      answers: req.body.answers,
      generatedPrompt: req.body.generatedPrompt
    };
    
    const createdPrompt = await database.createPrompt(prompt);
    res.json(createdPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

app.get('/api/prompts/:id', async (req, res) => {
  try {
    const prompt = await database.getPrompt(req.params.id);
    if (prompt) {
      res.json(prompt);
    } else {
      res.status(404).json({ error: 'Prompt not found' });
    }
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

app.delete('/api/prompts/:id', async (req, res) => {
  try {
    await database.deletePrompt(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    
    // Provide more specific error messages
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({ 
        error: 'Cannot delete prompt: It has dependent data (test results or versioned prompts). Please delete the dependent data first.' 
      });
    } else {
      res.status(500).json({ error: 'Failed to delete prompt' });
    }
  }
});

// File upload and testing endpoints
app.post('/api/upload', upload.single('jsonFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    let data;
    
    // Try to parse as JSON first
    try {
      data = JSON.parse(fileContent);
    } catch (jsonError) {
      // If JSON parsing fails, treat as plain text
      data = {
        content: fileContent,
        type: 'text',
        filename: req.file.originalname
      };
    }
    
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      data: data,
      size: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to process file' });
  }
});

app.post('/api/test', async (req, res) => {
  const { promptId, jsonData } = req.body;
  
  try {
    const prompt = await database.getPrompt(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const startTime = Date.now();
    
    // Prepare the message for ChatGPT
    let dataContent;
    
    if (jsonData.type === 'text') {
      dataContent = jsonData.content;
    } else {
      dataContent = JSON.stringify(jsonData, null, 2);
    }

    const userMessage = `${prompt.generatedPrompt}

Here is the ${jsonData.type === 'text' ? 'text' : 'JSON'} data to analyze:
\`\`\`${jsonData.type === 'text' ? 'text' : 'json'}
${dataContent}
\`\`\`

Please provide a comprehensive analysis following the instructions in the prompt.`;

    // Call ChatGPT API with retry logic for rate limits
    let completion;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specialized in JSON data analysis. Follow the user\'s instructions carefully and provide structured, insightful analysis.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 1000, // Reduced to avoid rate limits
          temperature: 0.7,
        });
        break; // Success, exit retry loop
      } catch (error) {
        if (error.status === 429) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Rate limit hit, retrying in ${retryDelay}ms... (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Exponential backoff
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    const processingTime = Date.now() - startTime;
    const chatGPTResponse = completion.choices[0].message.content;

    // Analyze the response for metrics
    const analysisResult = {
      summary: `Analysis of JSON data using custom prompt: ${prompt.name}`,
      insights: extractInsights(chatGPTResponse),
      confidence: calculateConfidence(chatGPTResponse),
      processingTime: processingTime,
      chatGPTResponse: chatGPTResponse,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    };

    const testResult = {
      id: uuidv4(),
      promptId: promptId,
      promptName: prompt.name,
      promptVersion: prompt.version || 1,
      jsonData: jsonData,
      result: analysisResult,
      timestamp: new Date().toISOString()
    };

    await database.createTestResult(testResult);
    res.json(testResult);
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    let errorMessage = 'Failed to test prompt with ChatGPT';
    let statusCode = 500;
    
    if (error.status === 401 || error.message.includes('UNAUTHORIZED')) {
      errorMessage = 'Invalid OpenAI API key. Please check your API key configuration.';
      statusCode = 401;
    } else if (error.status === 429 || error.message.includes('rate limit')) {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'OpenAI API quota exceeded. Please check your billing.';
      statusCode = 402;
    } else if (error.message.includes('invalid_api_key')) {
      errorMessage = 'Invalid OpenAI API key format. Please check your API key.';
      statusCode = 401;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// Helper functions for analyzing ChatGPT response
function extractInsights(response) {
  const lines = response.split('\n').filter(line => line.trim());
  const insights = [];
  
  // Look for bullet points, numbered lists, or key insights
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      insights.push(trimmed.replace(/^[-*]\s*|^\d+\.\s*/, ''));
    }
  });
  
  // If no structured insights found, split by paragraphs
  if (insights.length === 0) {
    const paragraphs = response.split('\n\n').filter(p => p.trim().length > 50);
    return paragraphs.slice(0, 5); // Return up to 5 paragraphs as insights
  }
  
  return insights.slice(0, 5); // Return up to 5 insights
}

function calculateConfidence(response) {
  // Simple confidence calculation based on response characteristics
  let confidence = 0.5; // Base confidence
  
  // Increase confidence for longer, detailed responses
  if (response.length > 500) confidence += 0.1;
  if (response.length > 1000) confidence += 0.1;
  
  // Increase confidence for structured responses
  if (response.includes('\n') || response.includes('-') || response.includes('1.')) {
    confidence += 0.1;
  }
  
  // Increase confidence for analytical keywords
  const analyticalKeywords = ['analysis', 'insight', 'pattern', 'recommendation', 'conclusion'];
  const foundKeywords = analyticalKeywords.filter(keyword => 
    response.toLowerCase().includes(keyword)
  );
  confidence += foundKeywords.length * 0.05;
  
  return Math.min(confidence, 0.95); // Cap at 95%
}

app.get('/api/results', async (req, res) => {
  try {
    const results = await database.getAllTestResults();
    res.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

app.get('/api/results/:promptId', async (req, res) => {
  try {
    const results = await database.getTestResultsForPrompt(req.params.promptId);
    res.json(results);
  } catch (error) {
    console.error('Error fetching test results for prompt:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Analytics endpoints
app.get('/api/analytics/overall', async (req, res) => {
  try {
    const analytics = await database.getOverallAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching overall analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/analytics/prompt/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { startDate, endDate } = req.query;
    
    const analytics = await database.getPromptAnalytics(
      promptId, 
      startDate, 
      endDate
    );
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching prompt analytics:', error);
    res.status(500).json({ error: 'Failed to fetch prompt analytics' });
  }
});

// Prompt versioning endpoints
app.get('/api/prompts/:name/versions', async (req, res) => {
  try {
    const { name } = req.params;
    const versions = await database.getPromptVersions(name);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching prompt versions:', error);
    res.status(500).json({ error: 'Failed to fetch prompt versions' });
  }
});

app.post('/api/prompts/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const originalPrompt = await database.getPrompt(id);
    if (!originalPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const clonedPrompt = {
      id: uuidv4(),
      name: name || `${originalPrompt.name} (Copy)`,
      questions: originalPrompt.questions,
      answers: originalPrompt.answers,
      generatedPrompt: originalPrompt.generatedPrompt
    };

    const createdPrompt = await database.createPrompt(clonedPrompt);
    res.json(createdPrompt);
  } catch (error) {
    console.error('Error cloning prompt:', error);
    res.status(500).json({ error: 'Failed to clone prompt' });
  }
});

app.get('/api/prompts/:id/compare/:versionId', async (req, res) => {
  try {
    const { id, versionId } = req.params;
    
    const [current, version] = await Promise.all([
      database.getPrompt(id),
      database.getPrompt(versionId)
    ]);

    if (!current || !version) {
      return res.status(404).json({ error: 'One or both prompts not found' });
    }

    res.json({
      current,
      version,
      comparison: {
        questionsChanged: JSON.stringify(current.questions) !== JSON.stringify(version.questions),
        answersChanged: JSON.stringify(current.answers) !== JSON.stringify(version.answers),
        promptChanged: current.generatedPrompt !== version.generatedPrompt
      }
    });
  } catch (error) {
    console.error('Error comparing prompts:', error);
    res.status(500).json({ error: 'Failed to compare prompts' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server starting on port ${PORT}`);
  await initializeServer();
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Database: SQLite`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  try {
    await database.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
