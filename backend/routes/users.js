const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { User, validate } = require('../models/user');

router.get('/', async (req, res) => {
  try {
    let users = await User.find().sort('_id');

    if (req.query.role) users = users.filter(user => user.role === req.query.role);
    if (req.query.code) users = users.filter(user => user.courses.includes(req.query.code));

    if (users.length === 0) return res.status(404).send(users);
    res.send(users);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (req.query.role && user.role === req.query.role) return res.send(user);
    if (!req.query.role) return res.send(user);

    res.status(404).send('Error, user not found...');
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(404).send(error.details[0].message);

  try {
    // hashing the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const body = { ...req.body };
    body.password = hashedPassword;

    const user = new User(body);
    await user.save();
    res.send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/:id/:password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (await bcrypt.compare(req.params.password, user.password)) return res.status(200).send(user);
      return res.status(401).send('Invalid login, please try again');
    }
    res.status(404).send('Invalid login, user not found');
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;