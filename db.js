require('dotenv').config(); // โหลดค่าจาก .env

const mysql = require('mysql2');

// สร้างการเชื่อมต่อฐานข้อมูล
const connection = mysql.createConnection({
  host: process.env.DB_HOST, // ใช้ค่าจาก .env
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: 'utf8mb4',
});

// ทดสอบการเชื่อมต่อ
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database as ID', connection.threadId);
});

// แปลง connection เป็น promise-based
const promiseConnection = connection.promise();

// ส่งออก promiseConnection
module.exports = promiseConnection;
