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
  .populate({
    path: 'thoughts',
    select: '-__v'
  })
  .populate({
    path: 'friends',
    select: '-__v'
  })
  .select('-__v')
  .sort({ _id: -1 })
  .then(dbUserData => res.json(dbUserData))
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
app.put('/api/users/:id', ({ params, body }, res) => {
  User.findOneAndUpdate({ _id: params.id }, body, { new: true })
  .then(dbUserData => res.json(dbUserData))
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// add friend
app.post('/api/users/:userId/friends/:friendId', ({ params, body }, res) => {
    User.findOneAndUpdate(
      { _id: params.userId }, 
      { $push: { friends: params.friendId } },
      { new: true }
    )
  .then(dbUserData => {
    if (!dbUserData) {
      res.status(404).json({ message: "No user found with this id!" });
    }
    res.json(dbUserData);
  })
  .catch(err => res.json(err));
});

// remove friend
app.delete('/api/users/:userId/friends/:friendId', ({ params, body }, res) => {
  User.findOneAndUpdate(
    { _id: params.userId }, 
    { $pull: { friends: params.friendId } },
    { new: true }
  )
.then(dbUserData => {
  if (!dbUserData) {
    res.status(404).json({ message: "No user found with this id!" });
  }
  res.json(dbUserData);
})
.catch(err => res.json(err));
});

// get thoughts
app.get('/api/thoughts', (req, res) => {
  Thought.find({})
  .then(dbThoughtData => res.json(dbThoughtData))
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// get single thought
app.get('/api/thought/:id', ({ params, body }, res) => {
  User.findOne({ _id: params.id })
  .populate({
    path: 'reactions',
    select: '-__v'
  })
  .select('-__v')
  .sort({ _id: -1 })
  .then(dbThoughtData => res.json(dbThoughtData))
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// create new thought
app.post('/api/thoughts/:userId', ({ params, body }, res) => {
  Thought.create(body) 
  .then(({ _id }) => {
    return User.findOneAndUpdate(
      { _id: params.userId },
      { $push: { thoughts: _id } },
      { new: true }
    );
  })
  .then(dbThoughtData => {
    if(!dbThoughtData) {
      res.status(404).json({ message: 'No thought found with this id!' });
      return;
    }
    res.json(dbThoughtData);
  })
  .catch(err => console.error(err));
});

// delete thought
app.delete('/api/thoughts/:userId/:thoughtId', ({ params }, res) => {
  Thought.findOneAndDelete({ _id: params.thoughtId }) 
  .then(({ _id }) => {
    return User.findOneAndUpdate(
      { _id: params.userId },
      { $pull: { thoughts: _id } }, // also removes from thought array in the user model
      { new: true }
    );
  })
  .then(dbThoughtData => {
    if(!dbThoughtData) {
      res.status(404).json({ message: 'No thought found with this id!' });
      return;
    }
    res.json(dbThoughtData);
  })
  .catch(err => console.error(err));
});

// update thought
app.put('/api/thoughts/:id', ({ params, body }, res) => {
  Thought.findOneAndUpdate({ _id: params.id }, body, { new: true })
  .then(dbThoughtData => {
    if(!dbThoughtData) {
      res.status(404).json({ message: 'No thought found with this id!' });
      return;
    }
    res.json(dbThoughtData);
  })
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// create reaction
app.post