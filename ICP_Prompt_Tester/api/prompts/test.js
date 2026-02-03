const OpenAI = require('openai');

// Mock databases
let prompts = [];
let testResults = [];

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { jsonData, testData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Prompt ID required' });
    }

    // Find prompt
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Mock AI response for now
    const mockResult = {
      id: require('uuid').v4(),
      promptId: id,
      promptName: prompt.name,
      jsonData: jsonData || {},
      result: {
        response: 'This is a mock AI response for testing purposes.',
        confidence: 0.85,
        processingTime: 1500,
        model: 'gpt-3.5-turbo',
        summary: 'Test completed successfully',
        chatGPTResponse: 'Mock response content here...',
        tokensUsed: 150,
        costUsd: 0.0003
      },
      tokensUsed: 150,
      costUsd: 0.0003,
      timestamp: new Date().toISOString()
    };

    // If OpenAI API key is configured, use real AI
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt.generatedPrompt || 'Test prompt'
            }
          ],
          max_tokens: 150
        });

        mockResult.result.response = completion.choices[0].message.content;
        mockResult.result.tokensUsed = completion.usage.total_tokens;
        mockResult.tokensUsed = completion.usage.total_tokens;
        mockResult.costUsd = (completion.usage.total_tokens / 1000) * 0.002;
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        // Keep mock response if AI fails
      }
    }

    // Save test result
    testResults.push(mockResult);

    res.json(mockResult);
  } catch (error) {
    console.error('Prompt test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
