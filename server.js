const express = require('express');
const mongoose = require('mongoose');

const { User, Thought } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/pizza-hunt', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Use this to log mongo queries being executed!
mongoose.set('debug', true);

// app.use(require('./routes'));

app.listen(PORT, () => console.log(`🌍 Connected on localhost:${PORT}`));

// get all users
app.get('/api/users', (req, res) => {
  User.find({})
  .then(dbUserData => res.json(dbUserData))
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// get single user
app.get('/api/users/:id', ({ params, body }, res) => {
  User.findOne({ _id: params.id })
  .then(dbUserData => res.json(dbUserData))
  .populate({
    path: 'thoughts',
    select: '-__v'
  })
  .select('-__v')
  .sort({ _id: -1 })
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// create new user
app.post('/api/users', ({ body }, res) => {
  User.create(body)
  .then(dbUserData => res.json(dbUserData))
  .catch(err => res.json(err));
});

// delete user
app.delete('/api/users/:id', ({ params }, res) => {
  User.findOneAndDelete({ _id: params.id })
  .then(dbUserData => res.json(dbUserData))
  .catch(err => res.json(err));
});

// update user
app.post('/api/users/:id', ({ params, body }, res) => {
  User.findOneAndUpdate({ _id: params.id }, body, { new: true })
  .then(dbUserData => res.json(dbUserData))
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});