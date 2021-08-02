const mysql = require('mysql2/promise');

const connectionData = require("./connectionData");

let dbPool = mysql.createPool(connectionData);

module.exports = dbPool;