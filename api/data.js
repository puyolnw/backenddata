const express = require('express');
const db = require('../db');
const router = express.Router();
const moment = require('moment');

// Function สร้าง ID เอกสาร (แบบ async/await)
const generateDocumentId = async () => {
  try {
    // ดึงเลขที่ล่าสุดจากฐานข้อมูล
    const conn = await db;
    const [maxNoResult] = await conn.query('SELECT MAX(SUBSTRING_INDEX(SUBSTRING_INDEX(id, ".", -1), "-", 1)) as max_num FROM data');
    const nextNo = (maxNoResult[0].max_num ? parseInt(maxNoResult[0].max_num) : 0) + 1;
    
    // ดึงวันที่ปัจจุบันและเลขที่รายการประจำวัน
    const datePart = moment().format('YYMMDD');
    const [dailyCountResult] = await conn.query('SELECT COUNT(*) as count FROM data WHERE DATE(created_at) = CURDATE()');
    const dailyNo = (dailyCountResult[0].count + 1).toString().padStart(3, '0');
    
    return `อว.${nextNo}-${datePart}${dailyNo}`;
  } catch (err) {
    console.error('Error generating document ID:', err);
    throw err;
  }
};

// GET: ดึงข้อมูลทั้งหมด
router.get('/', async (req, res) => {
  try {
    const conn = await db;
    const [results] = await conn.query('SELECT * FROM data ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET: ดึงข้อมูลตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await db;
    const [results] = await conn.query('SELECT * FROM data WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST: เพิ่มเอกสารใหม่
router.post('/', async (req, res) => {
  try {
    const { document_name, sender_name, receiver_name, notes } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!document_name || !sender_name || !receiver_name) {
      return res.status(400).json({ 
        error: 'Document name, sender name and receiver name are required' 
      });
    }
    
    // สร้าง ID เอกสาร
    const documentId = await generateDocumentId();
    
    // เพิ่มข้อมูลลงฐานข้อมูล
    const conn = await db;
    const [result] = await conn.query(
      'INSERT INTO data (id, document_name, sender_name, receiver_name, notes) VALUES (?, ?, ?, ?, ?)',
      [documentId, document_name, sender_name, receiver_name, notes || null]
    );
    
    res.status(201).json({ 
      message: 'Document created successfully',
      document_id: documentId
    });
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT: อัปเดตเอกสาร
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { document_name, sender_name, receiver_name, notes } = req.body;
    
    // ตรวจสอบว่ามีการส่งค่ามาอัปเดตอะไรบ้าง
    let query = 'UPDATE data SET ';
    const values = [];
    
    if (document_name) {
      query += 'document_name = ?, ';
      values.push(document_name);
    }
    if (sender_name) {
      query += 'sender_name = ?, ';
      values.push(sender_name);
    }
    if (receiver_name) {
      query += 'receiver_name = ?, ';
      values.push(receiver_name);
    }
    if (notes !== undefined) {
      query += 'notes = ?, ';
      values.push(notes || null);
    }
    
    // ถ้าไม่มีข้อมูลที่จะอัปเดต
    if (values.length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }
    
    query = query.slice(0, -2); // ลบคอมม่า (,) สุดท้าย
    query += ' WHERE id = ?';
    values.push(id);
    
    const conn = await db;
    const [result] = await conn.query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document updated successfully' });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE: ลบเอกสาร
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await db;
    const [result] = await conn.query('DELETE FROM data WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
