'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM `User` WHERE username = 'admin' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      return;
    }
    const hash = await bcrypt.hash('Admin123!', 10);
    await queryInterface.bulkInsert('User', [
      {
        username: 'admin',
        password: hash,
        firstname: 'Admin',
        lastname: 'AssurMoi',
        email: 'admin@assurmoi.fr',
        role: 'admin',
        isActive: true,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('User', { username: 'admin' });
  },
};
