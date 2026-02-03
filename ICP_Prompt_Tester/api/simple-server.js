const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple server is working',
    timestamp: new Date().toISOString(),
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing'
    }
  });
});

// Mock authentication endpoints
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Mock user for testing
    const mockUser = {
      id: uuidv4(),
      email: email,
      name: 'Test User'
    };

    // Generate token
    const token = jwt.sign(
      { id: mockUser.id, email: mockUser.email, name: mockUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      user: mockUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Mock user creation
    const mockUser = {
      id: uuidv4(),
      email: email,
      name: name
    };

    // Generate token
    const token = jwt.sign(
      { id: mockUser.id, email: mockUser.email, name: mockUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      user: mockUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock questions endpoint
app.get('/questions', (req, res) => {
  res.json([
    {
      id: '1',
      text: 'What is your name?',
      type: 'text',
      required: true,
      hardFilter: false,
      options: [],
      tags: ['basic'],
      created_at: new Date().toISOString()
    }
  ]);
});

// Export for Vercel serverless
module.exports = (req, res) => {
  app(req, res);
};
