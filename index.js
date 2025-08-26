const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

// In-memory data stores
const users = [];
const exercises = [];
let userIdCounter = 0;

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.json({ error: 'Username is required' });
  }

  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.json({ error: 'Username already exists' });
  }

  const newUser = {
    username: username,
    _id: (userIdCounter++).toString()
  };
  users.push(newUser);

  res.json({
    username: newUser.username,
    _id: newUser._id
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users.map(user => ({ username: user.username, _id: user._id })));
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = users.find(user => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!description || !duration) {
    return res.json({ error: 'Description and duration are required' });
  }

  const newExercise = {
    userId: _id,
    description: description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };
  exercises.push(newExercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: newExercise.date,
    duration: newExercise.duration,
    description: newExercise.description
  });
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find(user => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let userExercises = exercises.filter(ex => ex.userId === _id);

  if (from || to) {
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();
    userExercises = userExercises.filter(ex => {
      const exDate = new Date(ex.date);
      return exDate >= fromDate && exDate <= toDate;
    });
  }

  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
