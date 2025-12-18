const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer'); 

// 1. REGISTER 
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user', 
      location
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN (Sign In)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, 'MY_SECRET_KEY', { expiresIn: '1h' });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        email: user.email 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET COLLECTORS (For Admin Dashboard)
router.get('/collectors', async (req, res) => {
  try {
    const collectors = await User.find({ role: 'collector' });
    res.json(collectors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET USER PROFILE (Needed for Dashboard Persistence)
router.get('/get-user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET USER COUNT
router.get('/count', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'user' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👇 MISSING ROUTE 1: UPDATE STATUS (For Collector Dashboard) 👇
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status, leaveDate } = req.body;
    
    // Updates the collectorStatus field in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { collectorStatus: status, leaveDate: leaveDate }, 
      { new: true } // Return the updated document
    );
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👇 MISSING ROUTE 2: UNLOAD TRUCK (For Collector Dashboard) 👇
router.put('/unload-truck/:id', async (req, res) => {
  try {
    // Updates the lastUnloadTime
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { lastUnloadTime: new Date() },
      { new: true }
    );
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. SUPPORT EMAIL  
router.post('/support', async (req, res) => {
  try {
    const { subject, message, userId } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'user17emails@gmail.com', 
        pass: 'cowh rxlj glgw wlsa' 
      }
    });

    const mailOptions = {
      from: 'user12emails@gmail.com',     
      to: 'user12emails@gmail.com',       
      subject: `EcoCollect Support: ${subject}`,
      text: `
        You have received a new support message!
        
         From User ID: ${userId}
         Subject: ${subject}
        
         Message:
        ${message}
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    res.json({ message: "Email sent successfully!" });

  } catch (err) {
    console.error(" Email Error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;