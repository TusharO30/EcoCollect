const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes'); 
// Middleware
app.use(cors());
app.use(express.json()); 
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);  


// Database Connection
const MONGO_URI = 'mongodb+srv://tushar3031981_db_user:Tushar512@cluster0.vaaa2b9.mongodb.net/waste_managment_system?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected! '))
  .catch(err => console.log('DB Connection Error:', err));

// Simple Route to test
app.get('/', (req, res) => {
  res.send('Waste Management Backend is Running');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));