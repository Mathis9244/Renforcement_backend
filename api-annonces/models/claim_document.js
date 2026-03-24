const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClaimDocument extends Model {
    static associate(models) {
      ClaimDocument.belongsTo(models.Claim, { foreignKey: 'claimId', as: 'claim' });
      ClaimDocument.belongsTo(models.CaseFile, { foreignKey: 'caseFileId', as: 'caseFile' });
      ClaimDocument.belongsTo(models.User, { foreignKey: 'validatedById', as: 'validator' });
    }
  }

  ClaimDocument.init(
    {
      claimId: { type: DataTypes.INTEGER, allowNull: false },
      caseFileId: { type: DataTypes.INTEGER, allowNull: true },
      docType: { type: DataTypes.STRING(64), allowNull: false },
      fileUrl: { type: DataTypes.STRING(1024), allowNull: false },
      validationStatus: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
      validatedById: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'ClaimDocument',
      tableName: 'ClaimDocument',
      freezeTableName: true,
    }
  );

  return ClaimDocument;
};
