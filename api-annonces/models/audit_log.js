const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  AuditLog.init(
    {
      entityType: { type: DataTypes.STRING(64), allowNull: false },
      entityId: { type: DataTypes.STRING(64), allowNull: false },
      action: { type: DataTypes.STRING(128), allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      metadata: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'AuditLog',
      freezeTableName: true,
      updatedAt: false,
    }
  );

  return AuditLog;
};
