const router = require('express').Router();
const Apparel = require('../db/models/apparel');

//GET Apparel
router.get('/', async (req, res, next) => {
  try {
    const apparels = await Apparel.findAll();
    res.send(apparels);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
