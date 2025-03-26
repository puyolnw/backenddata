const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // เพิ่ม jsonwebtoken
const db = require('../db'); // เชื่อมต่อกับฐานข้อมูล
const router = express.Router();

// สร้าง secret key สำหรับ JWT (ควรเก็บไว้ใน .env)
const JWT_SECRET = 'your-secret-key'; // ควรใช้ process.env.JWT_SECRET ใน production

// POST: Login
router.post('/', (req, res) => {
  const { username, password } = req.body;

  // ตรวจสอบว่ามีการส่ง username และ password มาหรือไม่
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // ค้นหาผู้ใช้ในฐานข้อมูล
  db.query('SELECT * FROM user WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // ตรวจสอบว่าพบผู้ใช้หรือไม่
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];

    try {
      // ตรวจสอบรหัสผ่านด้วย bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // สร้าง JWT token
      const token = jwt.sign(
        { id: user.user_id, username: user.username, role: user.role }, // payload
        JWT_SECRET, // secret key
        { expiresIn: '1h' } // token หมดอายุใน 1 ชั่วโมง
      );

      // ส่งข้อมูลผู้ใช้และ token กลับ
      res.json({
        message: 'Login successful',
        token, // เพิ่ม token
        user: {
          id: user.user_id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Error comparing password:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

module.exports = router;