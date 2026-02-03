const { v4: uuidv4 } = require('uuid');

// Mock databases
let prompts = [];
let testResults = [];

module.exports = async (req, res) => {
  const { method } = req;
  const { query } = req;
  const { id } = query;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const prompt = prompts.find(p => p.id === id);
          if (!prompt) {
            return res.status(404).json({ error: 'Prompt not found' });
          }
          return res.json(prompt);
        }
        res.json(prompts);
        break;

      case 'POST':
        const { name, questions, answers, generatedPrompt } = req.body;
        
        const newPrompt = {
          id: uuidv4(),
          name,
          questions: questions || [],
          answers: answers || {},
          generatedPrompt: generatedPrompt || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        prompts.push(newPrompt);
        res.status(201).json(newPrompt);
        break;

      case 'DELETE':
        if (!id) {
          return res.status(400).json({ error: 'Prompt ID required' });
        }

        const deleteIndex = prompts.findIndex(p => p.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Prompt not found' });
        }

        prompts.splice(deleteIndex, 1);
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Prompts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
