const router = require('express').Router();

router.use('/users', require('./users'));
router.use('/apparel', require('./apparel'));
router.use('/books', require('./books'));
//accessories
//shoes
//belts
//jewelery
//collectibles
//home

router.use((req, res, next) => {
  const error = new Error('API route not found');
  error.status = 404;
  next(error);
});

module.exports = router;
