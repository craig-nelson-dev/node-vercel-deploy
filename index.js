// Import required modules
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require("cors");
const jwt = require('jsonwebtoken');

// Create an Express app
const app = express();
app.use(bodyParser.json(), cors());

// Generate a token
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role, username: user.username }, 'your-secret-key', { expiresIn: '1h' });
}

// Middleware to verify token
function verifyToken(req, res, next) {
  next();
  return ;
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

// Connect to MongoDB
const uri = "mongodb+srv://vercel-admin-user:i7zA1Uz1IEU0zDOj@cluster0.km3sslk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);
let db;

console.log()

client.connect((err) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
  console.log('Connected to MongoDB');
  db = client.db('mydatabase');

  // const insertAdmin = async () => {

  //   const user = await db.collection("users").findOne({ role: "admin" });
  //   if ( !user )
  //     db.collection("users").insertOne({
  //       username: "admin",
  //       password: "plato2000109",
  //       role: "admin",
  //       cover_letter: ""
  //     })
  // }

  // insertAdmin();
});

// API endpoints


app.post('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { username, password, role, cover_letter } = req.body;

    // Check if username already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = { username, password, role, cover_letter };
    await db.collection('users').insertOne(user);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/verify-password', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username, password });
    if (user) {
      const token = generateToken(user);
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/cover-letter/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    if (req.user.role === 'admin' || req.user.username !== username) {
      res.status(403).json({ error: 'Forbidden' });
    }

    const user = await db.collection('users').findOne({ username });
    if (user) {
      res.status(200).json({ cover_letter: user.cover_letter });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve cover letter' });
  }
});

app.get('/', async (req, res) => {
  try {
    res.json("Success");
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve cover letter' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
