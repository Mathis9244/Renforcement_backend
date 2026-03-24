const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      PasswordResetToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  PasswordResetToken.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      tokenHash: { type: DataTypes.STRING(255), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'PasswordResetToken',
      freezeTableName: true,
      updatedAt: false,
    }
  );

  return PasswordResetToken;
};
