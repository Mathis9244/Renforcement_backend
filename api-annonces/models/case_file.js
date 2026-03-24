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
