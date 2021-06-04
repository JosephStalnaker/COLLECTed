const Sequelize = require('sequelize');
const db = require('../db');

const User = db.define('user', {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  // password: {
  //   type: Sequelize.STRING,
  // },
  location: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  imageURL: {
    type: Sequelize.STRING,
    defaultValue:
      'https://cdn1.vectorstock.com/i/thumb-large/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg',
  },
});

module.exports = User;
