const express = require('express');
const db = require('../db');
const router = express.Router();
const moment = require('moment');

// Function สร้าง ID เอกสาร (แบบ async/await)
const generateDocumentId = async (docType) => {
  try {
    // ตรวจสอบว่า docType ถูกต้องหรือไม่
    const validDocTypes = [
      'อว.01619.05(1).08',
      'อว.01619.05(2).01',
      'อว.01619.05(2).02',
      'อว.01619.05(2).03',
      'อว.01619.05(2).04',
      'อว.01619.05(2).05',
      'อว.01619.05(2).06',
      'อว.01619.05(2).07',
      'อว.01619.05(2).08',
      'อว.01619.05(2).09'
    ];
    
    if (!validDocTypes.includes(docType)) {
      throw new Error('Invalid document type');
    }
    
    // ดึงเลขที่ล่าสุดจากฐานข้อมูลตามประเภทเอกสาร
    const conn = await db;
    const [maxNoResult] = await conn.query(
      'SELECT MAX(SUBSTRING_INDEX(id, "-", -1)) as max_num FROM data WHERE id LIKE ?',
      [`${docType}-%`]
    );
    
    // เริ่มต้นที่ 001 หรือเพิ่มจากเลขล่าสุด
    let nextNo;
    if (maxNoResult[0].max_num) {
      nextNo = parseInt(maxNoResult[0].max_num) + 1;
    } else {
      nextNo = 1;
    }
    
    // จัดรูปแบบให้เป็น 3 หลักเสมอ (001, 002, ...)
    const formattedNo = nextNo.toString().padStart(3, '0');
    
    return `${docType}-${formattedNo}`;
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

// GET: ดึงประเภทเอกสารทั้งหมด
router.get('/document-types', async (req, res) => {
  try {
    const documentTypes = [
      'อว.01619.05(1).08',
      'อว.01619.05(2).01',
      'อว.01619.05(2).02',
      'อว.01619.05(2).03',
      'อว.01619.05(2).04',
      'อว.01619.05(2).05',
      'อว.01619.05(2).06',
      'อว.01619.05(2).07',
      'อว.01619.05(2).08',
      'อว.01619.05(2).09'
    ];
    
    res.json(documentTypes);
  } catch (err) {
    console.error('Error fetching document types:', err);
    res.status(500).json({ error: 'Failed to fetch document types' });
  }
});

// GET: ดึงสถานะทั้งหมด
router.get('/statuses', async (req, res) => {
  try {
    const statuses = ['รอดำเนินการ', 'อนุมัติ', 'แก้ไข', 'อื่นๆ'];
    res.json(statuses);
  } catch (err) {
    console.error('Error fetching statuses:', err);
    res.status(500).json({ error: 'Failed to fetch statuses' });
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
// POST: เพิ่มเอกสารใหม่
router.post('/', async (req, res) => {
  try {
    const { 
      document_name, 
      sender_name, 
      receiver_name, 
      notes, 
      document_type, 
      action, 
      status,
      document_date 
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!document_name || !sender_name || !receiver_name || !document_type) {
      return res.status(400).json({ 
        error: 'Document name, sender name, receiver name and document type are required' 
      });
    }
    
    // สร้าง ID เอกสาร
    const documentId = await generateDocumentId(document_type);
    
    // กำหนดค่าเริ่มต้นสำหรับ status ถ้าไม่ได้ระบุ
    const documentStatus = status || 'รอดำเนินการ';
    
    // แปลงรูปแบบวันที่ให้ถูกต้อง
    let formattedDate = null;
    if (document_date) {
      // แปลง ISO string เป็นรูปแบบ YYYY-MM-DD
      formattedDate = document_date.substring(0, 10);
    }
    
    // เพิ่มข้อมูลลงฐานข้อมูล
    const conn = await db;
    const [result] = await conn.query(
      'INSERT INTO data (id, document_name, sender_name, receiver_name, notes, action, status, document_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [documentId, document_name, sender_name, receiver_name, notes || null, action || null, documentStatus, formattedDate]
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      document_name, 
      sender_name, 
      receiver_name, 
      notes, 
      action, 
      status,
      document_date 
    } = req.body;
    
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
    if (action !== undefined) {
      query += 'action = ?, ';
      values.push(action || null);
    }
    if (status) {
      query += 'status = ?, ';
      values.push(status);
    }
    if (document_date !== undefined) {
      query += 'document_date = ?, ';
      // แปลงรูปแบบวันที่ให้ถูกต้อง
      if (document_date) {
        // ตรวจสอบรูปแบบวันที่และแปลงให้เป็น YYYY-MM-DD
        if (typeof document_date === 'string' && document_date.includes('T')) {
          values.push(document_date.substring(0, 10));
        } else {
          values.push(document_date);
        }
      } else {
        values.push(null);
      }
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
