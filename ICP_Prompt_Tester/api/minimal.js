module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    message: 'Minimal API working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  }));
};
