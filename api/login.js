const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// สร้าง secret key สำหรับ JWT (ควรเก็บไว้ใน .env)
const JWT_SECRET = 'your-secret-key'; // ควรใช้ process.env.JWT_SECRET ใน production

// POST: Login - แก้ไขให้ใช้ async/await
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password: '***' });

    // ตรวจสอบว่ามีการส่ง username และ password มาหรือไม่
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // เชื่อมต่อกับฐานข้อมูล
    const conn = await db;
    
    // ค้นหาผู้ใช้ในฐานข้อมูล
    const [results] = await conn.query('SELECT * FROM user WHERE username = ?', [username]);
    
    // ตรวจสอบว่าพบผู้ใช้หรือไม่
    if (results.length === 0) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];
    console.log('User found:', { id: user.user_id, username: user.username });

    // ตรวจสอบรหัสผ่านด้วย bcryptjs
    console.log('Comparing passwords...');
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // สร้าง JWT token - เพิ่ม branchid ใน payload
    const token = jwt.sign(
      { 
        id: user.user_id, 
        username: user.username, 
        role: user.role,
        branchid: user.branchid 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ส่งข้อมูลผู้ใช้และ token กลับ - เพิ่ม branchid ในข้อมูลที่ส่งกลับ
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
        branchid: user.branchid
      },
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
