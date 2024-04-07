const mariadb = require('mariadb');
const dotenv = require("dotenv");
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.HOST,
  user: process.env.USERDB,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORTDB,
});

  // Función para ejecutar consultas con parámetros
async function executeQuerry(query, params) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(query, params);
      return rows;
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release(); // Liberar la conexión de vuelta al pool
    }
  }
  
  module.exports = { executeQuerry };