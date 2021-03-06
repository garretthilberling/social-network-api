const express = require('express');
const mongoose = require('mongoose');

const { User, Thought } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/social-network-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Use this to log mongo queries being executed!
mongoose.set('debug', true);

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
app.delete('/api/users/:id', async ({ params }, res) => {
  const promise1 = await User.findOneAndDelete({ _id: params.id });
  const promise2 = await Thought.deleteMany({ userId: { $in: params.id } }); // deletes all associated thoughts
  Promise.all([promise1, promise2])
  .then(dbUserData => res.json(dbUserData))
  .catch(err => res.json(err));
});

// update user
app.put('/api/users/:id', ({ params, body }, res) => {
  User.findOneAndUpdate({ _id: params.id }, body, { new: true, runValidators: true })
  .then(dbUserData => res.json(dbUserData))
  .catch(err => {
    console.error(err);
    res.sendStatus(400);
  });
});

// add friend
app.post('/api/users/:userId/friends/:friendId', async ({ params, body }, res) => {
  const promise1 = await User.findOneAndUpdate(
    { _id: params.userId }, 
    { $push: { friends: params.friendId } },
    { new: true }
  );
  
  const promise2 = await User.findOneAndUpdate(
    { _id: params.friendId }, 
    { $push: { friends: params.userId } },
    { new: true }
  );

  Promise.all([promise1, promise2]) // updates friends array for both users
  .then(dbUserData => {
    if (!dbUserData) {
      res.status(404).json({ message: "No user found with this id!" });
    }
    res.json(dbUserData);
  })
  .catch(err => res.json(err));
});

// remove friend
app.delete('/api/users/:userId/friends/:friendId', async ({ params, body }, res) => {
  const promise1 = await User.findOneAndUpdate(
    { _id: params.userId }, 
    { $pull: { friends: params.friendId } },
    { new: true }
  );
  
  const promise2 = await User.findOneAndUpdate(
    { _id: params.friendId }, 
    { $pull: { friends: params.userId } },
    { new: true }
  );

Promise.all([promise1, promise2]) // updates friends array for both users
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
app.get('/api/thoughts/:id', ({ params, body }, res) => {
  Thought.findOne({ _id: params.id })
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
app.post('/api/thoughts/:userId', async ({ params, body }, res) => {
  let id;
  const promise1 = await Thought.create(body)
  .then(({ _id }) => {
    id = _id; // moves id up in scope to be used in second promise
    return User.findOneAndUpdate(
      { _id: params.userId },
      { $push: { thoughts: _id } },
      { new: true }
    );
  });

  const promise2 = await Thought.findOneAndUpdate(
    { _id: id }, 
    { userId: params.userId }, 
    { new: true }
    ); // here we assign the userId field as the userId specified in the endpoint. 
      // this is so when a user is deleted all associated thoughts are as well
  Promise.all([promise1, promise2])
  .then(dbThoughtData => {
    if(!dbThoughtData) {
      res.status(404).json({ message: 'No user found with this id!' });
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
app.put('/api/thoughts/:thoughtId', ({ params, body }, res) => {
  Thought.findOneAndUpdate({ _id: params.thoughtId }, body, { new: true, runValidators: true })
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
app.post('/api/thoughts/:thoughtId/reactions', ({ params, body }, res) => {
  Thought.findOneAndUpdate(
    { _id: params.thoughtId },
    { $push: { reactions: body } },
    { new: true, runValidators: true }
  )
  .then(dbThoughtData => {
    if(!dbThoughtData) {
      res.status(404).json({ message: 'No thought data found with this id!' });
      return
    }
    res.json(dbThoughtData);
  })
  .catch(err => res.json(err));
});

// delete reaction
app.delete('/api/thoughts/:thoughtId/reactions/:reactionId', ({ params, body }, res) => {
  Thought.findOneAndUpdate(
    { _id: params.thoughtId },
    { $pull: { reactions: { reactionId: params.reactionId } } },
    { new: true }
  )
  .then(dbThoughtData => res.json(dbThoughtData))
  .catch(err => res.json(err));
});