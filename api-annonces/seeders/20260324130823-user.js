'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('User', [
      {
        username: 'mbianic',
        password: 'MotDeP@ss123',
        firstname: 'Mathis',
        lastname: 'Bianic',
        email: 'mathis.bianic@gmail.com'
      }
    ], {})
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('User', { username: 'mbianic' })
  }
};
