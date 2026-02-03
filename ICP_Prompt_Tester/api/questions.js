const { v4: uuidv4 } = require('uuid');

// Mock database
let questions = [
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
];

module.exports = async (req, res) => {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        res.json(questions);
        break;

      case 'POST':
        const { text, type, required, hardFilter, options, tags } = req.body;
        
        const newQuestion = {
          id: uuidv4(),
          text,
          type: type || 'text',
          required: required || false,
          hardFilter: hardFilter || false,
          options: options || [],
          tags: tags || [],
          created_at: new Date().toISOString()
        };

        questions.push(newQuestion);
        res.status(201).json(newQuestion);
        break;

      case 'PUT':
        const { id } = req.query;
        const updateData = req.body;
        
        const questionIndex = questions.findIndex(q => q.id === id);
        if (questionIndex === -1) {
          return res.status(404).json({ error: 'Question not found' });
        }

        questions[questionIndex] = { ...questions[questionIndex], ...updateData };
        res.json(questions[questionIndex]);
        break;

      case 'DELETE':
        const { id: deleteId } = req.query;
        
        const deleteIndex = questions.findIndex(q => q.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Question not found' });
        }

        questions.splice(deleteIndex, 1);
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
