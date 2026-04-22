const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CaseFile extends Model {
    static associate(models) {
      CaseFile.belongsTo(models.Claim, { foreignKey: 'claimId', as: 'claim' });
      CaseFile.belongsTo(models.User, { foreignKey: 'assignedToId', as: 'assignee' });
      CaseFile.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
      CaseFile.hasMany(models.CaseTransition, { foreignKey: 'caseFileId', as: 'transitions' });
      CaseFile.hasMany(models.Approval, { foreignKey: 'caseFileId', as: 'approvals' });
    }
  }

  CaseFile.init(
    {
      caseNumber: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      claimId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      scenario: { type: DataTypes.STRING(32), allowNull: false },
      currentState: { type: DataTypes.STRING(128), allowNull: false },
      assignedToId: { type: DataTypes.INTEGER, allowNull: true },
      createdById: { type: DataTypes.INTEGER, allowNull: true },

      expertisePlannedAt: { type: DataTypes.DATE, allowNull: true },
      expertiseDoneAt: { type: DataTypes.DATE, allowNull: true },
      expertiseReportUrl: { type: DataTypes.STRING(1024), allowNull: true },
      expertiseDiagnostic: { type: DataTypes.STRING(32), allowNull: true },

      interventionPlannedAt: { type: DataTypes.DATE, allowNull: true },
      vehiclePickupPlannedAt: { type: DataTypes.DATE, allowNull: true },
      vehiclePickupAt: { type: DataTypes.DATE, allowNull: true },
      interventionStartAt: { type: DataTypes.DATE, allowNull: true },
      interventionEndAt: { type: DataTypes.DATE, allowNull: true },
      restitutionPlannedAt: { type: DataTypes.DATE, allowNull: true },
      restitutionAt: { type: DataTypes.DATE, allowNull: true },
      invoiceReceivedAt: { type: DataTypes.DATE, allowNull: true },
      invoiceUrl: { type: DataTypes.STRING(1024), allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      thirdPartyPaid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      indemnisationEstimate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      insuredApproval: { type: DataTypes.BOOLEAN, allowNull: true },
      insuredRibUrl: { type: DataTypes.STRING(1024), allowNull: true },
      indemnisationPaidAt: { type: DataTypes.DATE, allowNull: true },

      closedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'CaseFile',
      tableName: 'CaseFile',
      freezeTableName: true,
    }
  );

  return CaseFile;
};
