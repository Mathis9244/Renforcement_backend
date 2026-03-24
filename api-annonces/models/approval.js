const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Approval extends Model {
    static associate(models) {
      Approval.belongsTo(models.CaseFile, { foreignKey: 'caseFileId', as: 'caseFile' });
      Approval.belongsTo(models.User, { foreignKey: 'requesterId', as: 'requester' });
      Approval.belongsTo(models.User, { foreignKey: 'approverId', as: 'approver' });
    }
  }

  Approval.init(
    {
      caseFileId: { type: DataTypes.INTEGER, allowNull: false },
      stepKey: { type: DataTypes.STRING(128), allowNull: false },
      requesterId: { type: DataTypes.INTEGER, allowNull: true },
      approverId: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    },
    {
      sequelize,
      modelName: 'Approval',
      tableName: 'Approval',
      freezeTableName: true,
    }
  );

  return Approval;
};
