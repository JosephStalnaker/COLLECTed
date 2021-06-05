const db = require('./db');

const User = require('./models/User');
const Book = require('./models/Book');

//associations could go here!
User.hasMany(Book);
Book.belongsTo(User);

module.exports = {
  db,
  models: {
    User,
    Book,
  },
};
