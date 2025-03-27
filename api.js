const express = require('express');
const cors = require('cors');
const userRoutes = require('./api/user');
const loginRoutes = require('./api/login');
const dataRoutes = require('./api/data');
const app = express();

// ใช้ CORS Middleware
app.use(cors({
  origin: '*',  // เปิดให้ทุกที่เข้าถึงได้
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // ถ้า frontend มีการส่ง cookie หรือ token ต้องเปิดอันนี้
}));

// Middleware สำหรับจัดการข้อผิดพลาด JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

app.use(express.json());
app.use('/uploads', express.static('public/uploads'));
app.use('/api/users', userRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/data', dataRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

const PORT = process.env.PORT || 3301;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
