module.exports = (req, res) => {
  res.json({ 
    message: 'API is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};
