require('dotenv').config()

const dbUsername = process.env.DB_USERNAME || 'root';
const dbPassword = process.env.DB_PASSWORD || 'root';
const dbHost = process.env.DB_HOST || 'app-assurmoi-db';
const dbPort = process.env.DB_PORT || '3306';
const dbName = process.env.DB_NAME || 'assurmoidb';
const useSSL = process.env.DB_SSL === 'true';

module.exports = {
	development: {
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    host: dbHost,
		port: dbPort,
    dialect: "mariadb",
		dialectOptions: useSSL ? {
			ssl: {
				require: true
			}
    } : {}
  },
  test: {
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    host: dbHost,
		port: dbPort,
    dialect: "mariadb",
		dialectOptions: useSSL ? {
        ssl: {
            require: true
        }
    } : {}
  },
  production: {
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    host: dbHost,
		port: dbPort,
    dialect: "mariadb",
		dialectOptions: useSSL ? {
        ssl: {
            require: true
        }
    } : {}
  }
}