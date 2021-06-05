const router = require('express').Router();
const User = require('../db/models/user');

//GET User
router.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
