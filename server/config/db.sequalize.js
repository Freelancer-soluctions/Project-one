export default {
  development: {
    username: 'projectonebd_futi_user',
    password: 'sp6OOpGoEJRAdtFd63H2FQppzwyldLj3',
    database: 'hacktiv_gift',
    host: process.env('DATABASE_URL'),
    dialect: 'REPLACED_DB_PASSWORD'
  },
  test: {
    username: 'REPLACED_DB_PASSWORD',
    password: 'REPLACED_DB_PASSWORD',
    database: 'hacktiv_gift_test',
    host: '127.0.0.1',
    dialect: 'REPLACED_DB_PASSWORD',
    logging: false
  },
  production: {
    username: 'root',
    password: null,
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'mysql'
  }
}
