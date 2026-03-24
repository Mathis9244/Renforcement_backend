'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('User', 'role', {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'charge_clientele',
    });
    await queryInterface.addColumn('User', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('User', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('User', 'twoFactorSecret', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('User', 'twoFactorSecret');
    await queryInterface.removeColumn('User', 'twoFactorEnabled');
    await queryInterface.removeColumn('User', 'isActive');
    await queryInterface.removeColumn('User', 'role');
  },
};
