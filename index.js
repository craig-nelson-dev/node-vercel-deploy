
// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors");
const jwt = require('jsonwebtoken');

// Create a MongoDB schema for User
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  cover_letter: String
});

// Create a User model based on the schema
const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Create an Express app
const app = express();
app.use(bodyParser.json(), cors());

// Generate a token
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role, username: user.username }, 'your-secret-key', { expiresIn: '1h' });
}

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}

// API endpoints

app.post('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { username, password, role, cover_letter } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({ username, password, role, cover_letter });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});


app.post('/verify-password', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
      const token = generateToken(user);
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

app.get('/cover-letter/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    if (req.user.role === 'admin' || req.user.username !== username ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findOne({ username });
    if (user) {
      res.status(200).json({ cover_letter: user.cover_letter });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve cover letter' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
