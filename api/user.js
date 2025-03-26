const express = require('express');
const bcryptjs = require('bcryptjs');
const db = require('../db'); // เชื่อมต่อกับฐานข้อมูล
const router = express.Router();

// GET: ดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const conn = await db;
    const [results] = await conn.query('SELECT * FROM user');
    res.json(results);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET: ดึงข้อมูลผู้ใช้ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await db;
    const [results] = await conn.query('SELECT * FROM user WHERE user_id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST: เพิ่มผู้ใช้ใหม่
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10); // เข้ารหัสรหัสผ่าน
    
    const conn = await db;
    const [result] = await conn.query(
      'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role || 'member']
    );
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user_id: result.insertId 
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT: อัปเดตข้อมูลผู้ใช้
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    let query = 'UPDATE user SET ';
    const values = [];

    // ตรวจสอบว่ามีการส่งค่ามาอัปเดตอะไรบ้าง
    if (username) {
      query += 'username = ?, ';
      values.push(username);
    }
    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10); // เข้ารหัสรหัสผ่านใหม่
      query += 'password = ?, ';
      values.push(hashedPassword);
    }
    if (role) {
      query += 'role = ?, ';
      values.push(role);
    }

    if (values.length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }

    query = query.slice(0, -2); // ลบคอมม่า (,) สุดท้าย
    query += ' WHERE user_id = ?';
    values.push(id);

    const conn = await db;
    const [result] = await conn.query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE: ลบผู้ใช้
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await db;
    const [result] = await conn.query('DELETE FROM user WHERE user_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
