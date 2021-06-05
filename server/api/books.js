const router = require('express').Router();
const Book = require('../db/models/book');

//GET User
router.get('/', async (req, res, next) => {
  try {
    const books = await Book.findAll();
    res.send(books);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
