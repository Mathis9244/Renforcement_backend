const fs = require('fs')
const path = require('path')
const process = require('process')
const basename = path.basename(__filename)
const db = {}

const { Sequelize } = require('sequelize')
require('dotenv').config()

const dbUsername = process.env.DB_USERNAME || 'root';
const dbPassword = process.env.DB_PASSWORD || 'root';
const dbHost = process.env.DB_HOST || 'app-assurmoi-db';
const dbPort = process.env.DB_PORT || '3306';
const dbName = process.env.DB_NAME || 'assurmoidb';
const useSSL = process.env.DB_SSL === 'true';

const dbInstance = new Sequelize(`mariadb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`, {
    dialect: 'mariadb',
    dialectOptions: useSSL ? {
        ssl: {
            require: true
        }
    } : {}
})

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(dbInstance, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = {
    dbInstance,
    ...db
}