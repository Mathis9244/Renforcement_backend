const { Model, DataTypes } = require('sequelize')

const User = (dbInstance, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Claim, { foreignKey: 'createdById', as: 'createdClaims' });
            User.hasMany(models.CaseFile, { foreignKey: 'assignedToId', as: 'assignedCases' });
            User.hasMany(models.CaseFile, { foreignKey: 'createdById', as: 'createdCases' });
        }
    }

    User.init(
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            firstname: {
                type: DataTypes.STRING,
                allowNull: true
            },
            lastname: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: DataTypes.STRING,
            role: {
                type: DataTypes.STRING(64),
                allowNull: false,
                defaultValue: 'charge_clientele',
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            twoFactorEnabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            twoFactorSecret: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            sequelize: dbInstance,
            modelName: 'User',
            tableName: 'User',
            freezeTableName: true,
            timestamps: false,
            defaultScope: {
                attributes: { exclude: ['password', 'twoFactorSecret'] },
            },
            scopes: {
                withPassword: {
                    attributes: { exclude: ['twoFactorSecret'] },
                },
            },
        }
    )

    return User;
}

module.exports = User