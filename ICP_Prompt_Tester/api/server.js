const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const database = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Initialize database
async function initializeServer() {
  try {
    await database.connect();
    await database.initialize();
    console.log('🗄️ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication Routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name
    };
    
    await database.createUser(user);
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await database.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await database.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Questions Routes
app.get('/questions', async (req, res) => {
  try {
    const questions = await database.getAllQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/questions', async (req, res) => {
  try {
    const question = {
      id: uuidv4(),
      ...req.body
    };
    
    const createdQuestion = await database.createQuestion(question);
    res.json(createdQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

app.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedQuestion = await database.updateQuestion(id, req.body);
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

app.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await database.deleteQuestion(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Prompts Routes
app.get('/prompts', async (req, res) => {
  try {
    const prompts = await database.getAllPrompts();
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

app.post('/prompts', async (req, res) => {
  try {
    const prompt = {
      id: uuidv4(),
      ...req.body
    };
    
    const createdPrompt = await database.createPrompt(prompt);
    res.json(createdPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

app.get('/prompts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prompt = await database.getPrompt(id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

app.delete('/prompts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await database.deletePrompt(id);
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// Test Results Routes
app.get('/results', async (req, res) => {
  try {
    const results = await database.getAllTestResults();
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.post('/results', async (req, res) => {
  try {
    const result = {
      id: uuidv4(),
      ...req.body
    };
    
    const createdResult = await database.createTestResult(result);
    res.json(createdResult);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: 'Failed to create result' });
  }
});

// AI Testing Route
app.post('/prompts/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { jsonData } = req.body;
    
    // Get prompt
    const prompt = await database.getPrompt(id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-actual-openai-api-key-here')) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const startTime = Date.now();
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: prompt.generated_prompt
        },
        {
          role: 'user',
          content: JSON.stringify(jsonData)
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const processingTime = Date.now() - startTime;
    const chatGPTResponse = completion.choices[0].message.content;

    // Create test result
    const result = {
      id: uuidv4(),
      prompt_id: id,
      prompt_name: prompt.name,
      prompt_version: prompt.version,
      json_data: JSON.stringify(jsonData),
      json_type: 'json',
      result_summary: chatGPTResponse.substring(0, 200),
      result_insights: [],
      confidence: 0.8,
      processing_time: processingTime,
      chatgpt_response: chatGPTResponse,
      model: completion.model,
      tokens_used: completion.usage?.total_tokens || 0,
      cost_usd: calculateCost(completion.usage?.total_tokens || 0, completion.model),
      success: 1
    };

    await database.createTestResult(result);

    res.json({
      result: chatGPTResponse,
      processingTime,
      tokensUsed: completion.usage?.total_tokens || 0,
      costUsd: result.cost_usd
    });

  } catch (error) {
    console.error('Error testing prompt:', error);
    res.status(500).json({ error: 'Failed to test prompt' });
  }
});

// Helper function to calculate cost
function calculateCost(tokens, model) {
  const costs = {
    'gpt-3.5-turbo': 0.002,
    'gpt-4': 0.03
  };
  const costPer1kTokens = costs[model] || costs['gpt-3.5-turbo'];
  return (tokens / 1000) * costPer1kTokens;
}

// Initialize server
initializeServer();

// Export for Vercel serverless
module.exports = (req, res) => {
  app(req, res);
};
