const config = {
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "password123",
  server: process.env.DB_HOST || "127.0.0.1", // replace this with your IP Server
  database: process.env.DB || "menv",
  port: process.env.DB_PORT || 37017, // this is optional, by default takes the port 1433
  /*options: {
    encrypt: true, // this is optional, by default is false
    enableArithAbort: true,
    trustServerCertificate: true
  },*/
};

const { Pool } = require("pg");
const mongoose = require("mongoose");

const server = `${config.server}:${config.port}`;
//*if is mongo
var user = ``;
if (config.user.length > 0 && config.password.length > 0) {
  user = `${config.user}:${config.password}@`;
}

const URI = `mongodb://${user}${server}/${config.database}?authSource=admin`;

console.log(URI);

mongoose.set("strictQuery", false);

mongoose.connect(URI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const pool = new Pool({
  host: "192.168.101.222",
  user: "postgres",
  password: "wQVj9D0WDzJYtiAJr9MgjOdwiZtILLyiwe7cwWmhIzXmaVwIET",
  database: "surveys",
  port: 5432,
});

module.exports = { db, pool };
