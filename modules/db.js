const mysql = require('mysql2/promise');

const connectionData = require("./databaseConnection");

let dbPool = mysql.createPool(connectionData);

module.exports = dbPool;