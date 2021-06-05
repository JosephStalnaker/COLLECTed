const { green, red } = require('chalk');
const db = require('./server/db/db.js');
const Book = require('./server/db/models/Book.js');
const User = require('./server/db/models/User.js');

const users = [
  {
    username: 'user1',
    firstName: 'User',
    lastName: 'One',
    location: 'Earth',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
];

const books = [
  {
    title: 'Book',
    author: 'Book Writer',
    publisher: 'Book Publisher',
    edition: '1st',
    description:
      'Book about books regarding the history of books written in book form.',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
];

const seed = async () => {
  try {
    await db.sync({ force: true });

    await Promise.all(
      users.map((user) => {
        return User.create(user);
      })
    );
    await Promise.all(
      books.map((book) => {
        return Book.create(book);
      })
    );
  } catch (error) {
    console.error(red('Error seeding'));
    console.error(error);
    db.close();
  }
};

module.exports = seed;

if (require.main === module) {
  seed()
    .then(() => {
      console.log(green('Successful seeding'));
    })
    .catch((error) => {
      console.error(red('Error seeding'));
      console.error();
      db.close();
    });
}
