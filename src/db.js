const mysql = require('mysql2');
const { host, user, database, password } = require('./config/dbconfig')

const pool = mysql.createPool({
  host,
  user,
  database,
  password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

module.exports = pool;