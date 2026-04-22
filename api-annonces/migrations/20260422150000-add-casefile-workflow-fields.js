'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CaseFile', 'expertisePlannedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'expertiseDoneAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'expertiseReportUrl', {
      type: Sequelize.STRING(1024),
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'expertiseDiagnostic', {
      type: Sequelize.STRING(32),
      allowNull: true,
      comment: 'reparable | total_loss',
    });

    // Scenario reparable
    await queryInterface.addColumn('CaseFile', 'interventionPlannedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'vehiclePickupPlannedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'vehiclePickupAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'interventionStartAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'interventionEndAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'restitutionPlannedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'restitutionAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'invoiceReceivedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'invoiceUrl', {
      type: Sequelize.STRING(1024),
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'paidAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'thirdPartyPaid', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Scenario total_loss
    await queryInterface.addColumn('CaseFile', 'indemnisationEstimate', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'insuredApproval', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      comment: 'Approval from insured for estimate (total_loss)',
    });
    await queryInterface.addColumn('CaseFile', 'insuredRibUrl', {
      type: Sequelize.STRING(1024),
      allowNull: true,
    });
    await queryInterface.addColumn('CaseFile', 'indemnisationPaidAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('CaseFile', 'closedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('CaseFile', 'closedAt');
    await queryInterface.removeColumn('CaseFile', 'indemnisationPaidAt');
    await queryInterface.removeColumn('CaseFile', 'insuredRibUrl');
    await queryInterface.removeColumn('CaseFile', 'insuredApproval');
    await queryInterface.removeColumn('CaseFile', 'indemnisationEstimate');
    await queryInterface.removeColumn('CaseFile', 'thirdPartyPaid');
    await queryInterface.removeColumn('CaseFile', 'paidAt');
    await queryInterface.removeColumn('CaseFile', 'invoiceUrl');
    await queryInterface.removeColumn('CaseFile', 'invoiceReceivedAt');
    await queryInterface.removeColumn('CaseFile', 'restitutionAt');
    await queryInterface.removeColumn('CaseFile', 'restitutionPlannedAt');
    await queryInterface.removeColumn('CaseFile', 'interventionEndAt');
    await queryInterface.removeColumn('CaseFile', 'interventionStartAt');
    await queryInterface.removeColumn('CaseFile', 'vehiclePickupAt');
    await queryInterface.removeColumn('CaseFile', 'vehiclePickupPlannedAt');
    await queryInterface.removeColumn('CaseFile', 'interventionPlannedAt');
    await queryInterface.removeColumn('CaseFile', 'expertiseDiagnostic');
    await queryInterface.removeColumn('CaseFile', 'expertiseReportUrl');
    await queryInterface.removeColumn('CaseFile', 'expertiseDoneAt');
    await queryInterface.removeColumn('CaseFile', 'expertisePlannedAt');
  },
};

