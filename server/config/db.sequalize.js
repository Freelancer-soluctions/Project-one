export default {
  development: {
    username: 'projectonebd_futi_user',
    password: 'sp6OOpGoEJRAdtFd63H2FQppzwyldLj3',
    database: 'hacktiv_gift',
    host: process.env('DATABASE_URL'),
    dialect: 'postgres'
  },
  test: {
    username: 'postgres',
    password: 'postgres',
    database: 'hacktiv_gift_test',
    host: '127.0.0.1',
    dialect: 'postgres',
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
