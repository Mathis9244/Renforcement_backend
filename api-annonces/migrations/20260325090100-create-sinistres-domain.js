'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Claim', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      vehicleRegistration: { type: Sequelize.STRING(32), allowNull: false },
      driverFirstName: { type: Sequelize.STRING(128), allowNull: false },
      driverLastName: { type: Sequelize.STRING(128), allowNull: false },
      driverIsInsured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      callAt: { type: Sequelize.DATE, allowNull: false },
      accidentAt: { type: Sequelize.DATE, allowNull: false },
      contextText: { type: Sequelize.TEXT, allowNull: false },
      liabilityAccepted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      liabilityPercent: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'draft' },
      createdById: {
        type: Sequelize.INTEGER,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('CaseFile', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      caseNumber: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      claimId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Claim', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scenario: { type: Sequelize.STRING(32), allowNull: false },
      currentState: { type: Sequelize.STRING(128), allowNull: false },
      assignedToId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('ClaimDocument', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      claimId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Claim', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      caseFileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'CaseFile', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      docType: { type: Sequelize.STRING(64), allowNull: false },
      fileUrl: { type: Sequelize.STRING(1024), allowNull: false },
      validationStatus: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
      validatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('CaseTransition', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      caseFileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'CaseFile', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fromState: { type: Sequelize.STRING(128), allowNull: true },
      toState: { type: Sequelize.STRING(128), allowNull: false },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      comment: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('AuditLog', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      entityType: { type: Sequelize.STRING(64), allowNull: false },
      entityId: { type: Sequelize.STRING(64), allowNull: false },
      action: { type: Sequelize.STRING(128), allowNull: false },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      metadata: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('Approval', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      caseFileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'CaseFile', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stepKey: { type: Sequelize.STRING(128), allowNull: false },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approverId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable('PasswordResetToken', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tokenHash: { type: Sequelize.STRING(255), allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PasswordResetToken');
    await queryInterface.dropTable('Approval');
    await queryInterface.dropTable('AuditLog');
    await queryInterface.dropTable('CaseTransition');
    await queryInterface.dropTable('ClaimDocument');
    await queryInterface.dropTable('CaseFile');
    await queryInterface.dropTable('Claim');
  },
};
