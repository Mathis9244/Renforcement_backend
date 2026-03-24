const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Claim extends Model {
    static associate(models) {
      Claim.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
      Claim.hasOne(models.CaseFile, { foreignKey: 'claimId', as: 'caseFile' });
      Claim.hasMany(models.ClaimDocument, { foreignKey: 'claimId', as: 'documents' });
    }
  }

  Claim.init(
    {
      vehicleRegistration: { type: DataTypes.STRING(32), allowNull: false },
      driverFirstName: { type: DataTypes.STRING(128), allowNull: false },
      driverLastName: { type: DataTypes.STRING(128), allowNull: false },
      driverIsInsured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      callAt: { type: DataTypes.DATE, allowNull: false },
      accidentAt: { type: DataTypes.DATE, allowNull: false },
      contextText: { type: DataTypes.TEXT, allowNull: false },
      liabilityAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      liabilityPercent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'draft' },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Claim',
      tableName: 'Claim',
      freezeTableName: true,
    }
  );

  return Claim;
};
