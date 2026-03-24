const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CaseTransition extends Model {
    static associate(models) {
      CaseTransition.belongsTo(models.CaseFile, { foreignKey: 'caseFileId', as: 'caseFile' });
      CaseTransition.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  CaseTransition.init(
    {
      caseFileId: { type: DataTypes.INTEGER, allowNull: false },
      fromState: { type: DataTypes.STRING(128), allowNull: true },
      toState: { type: DataTypes.STRING(128), allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'CaseTransition',
      tableName: 'CaseTransition',
      freezeTableName: true,
      updatedAt: false,
    }
  );

  return CaseTransition;
};
