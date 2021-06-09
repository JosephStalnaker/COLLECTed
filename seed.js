const { green, red } = require('chalk');
const db = require('./server/db/db.js');
const Book = require('./server/db/models/Book.js');
const User = require('./server/db/models/User.js');
const Apparel = require('./server/db/models/Apparel.js');

const users = [
  {
    username: 'user1',
    firstName: 'User',
    lastName: 'One',
    location: 'New York, NY',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
  {
    username: 'user2',
    firstName: 'User2',
    lastName: 'Two',
    location: 'Berlin, Germany',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
  {
    username: 'user3',
    firstName: 'User3',
    lastName: 'Three',
    location: 'Vienna, Austria',
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
  {
    title: 'Book2',
    author: 'Book Writer 2',
    publisher: 'Book Publisher2',
    edition: '1st',
    description:
      'Book about books regarding the history of books written in book form.',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
  {
    title: 'Book3',
    author: 'Book Writer 3',
    publisher: 'Book Publisher 3',
    edition: '1st',
    description:
      'Book about books regarding the history of books written in book form.',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
];

const apparels = [
  {
    title: 'Shirt',
    designer: 'Helmut Lang',
    size: 'M',
    description: 'Runway shirt from F/W 00 collection.',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
  {
    title: 'Pants',
    designer: 'Raf Simons',
    size: 'L',
    description: 'Runway pants from S/S 00 collection.',
    imageUrl:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
  {
    title: 'Sweater',
    designer: 'Martin Margiela',
    size: 'M',
    description: 'Runway sweater from F/W 01 collection.',
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
    await Promise.all(
      apparels.map((apparel) => {
        return Apparel.create(apparel);
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
