// файл ./config/index.js
const fs = require('fs');
const path = require('path');

const config = {
  db: {
    mysql: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, '../ca-certificate-test.crt')),
      }
    },
  },
  port: process.env.PORT || 3000, // порт на котором будет запущен сервер приложения
  jwtSecret: process.env.JWT_SECRET
};

module.exports = config;
