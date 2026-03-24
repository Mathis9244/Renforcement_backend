'use strict';

/**
 * Mot de passe initial : Admin123!
 * Hash bcrypt (10 rounds) pré-calculé pour éviter require('bcryptjs') dans le seeder :
 * le volume Docker `api-annonces-node-modules` peut ne pas contenir toutes les deps tant qu'on n'a pas fait `npm install` dans le conteneur.
 */
const ADMIN_PASSWORD_HASH =
  '$2b$10$aErxwIbX6Gl8WjWKvskZwuD.4DYr9xDAGzNcgiIqvK5N0.YqY8qxK';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM `User` WHERE username = 'admin' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      return;
    }
    await queryInterface.bulkInsert('User', [
      {
        username: 'admin',
        password: ADMIN_PASSWORD_HASH,
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
