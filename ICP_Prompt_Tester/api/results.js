// Mock database
let testResults = [];

module.exports = async (req, res) => {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        res.json(testResults);
        break;

      case 'POST':
        const newResult = {
          ...req.body,
          id: require('uuid').v4(),
          timestamp: new Date().toISOString()
        };

        testResults.push(newResult);
        res.status(201).json(newResult);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
