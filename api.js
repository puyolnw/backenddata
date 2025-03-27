const express = require('express');
const cors = require('cors');
const userRoutes = require('./api/user');
const loginRoutes = require('./api/login');
const dataRoutes = require('./api/data');
const app = express();

// เปิด CORS ให้ทุกที่เข้าถึงได้
app.use(cors());

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
