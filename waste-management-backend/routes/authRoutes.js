const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer'); 

// REGISTER 
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

// LOGIN (Sign In)
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

// GET COLLECTORS
router.get('/collectors', async (req, res) => {
  try {
    const collectors = await User.find({ role: 'collector' });
    res.json(collectors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET USER COUNT
router.get('/count', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'user' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//NEW: SUPPORT EMAIL  
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

    // 3. Send the Email
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully to user12emails@gmail.com");
    res.json({ message: "Email sent successfully!" });

  } catch (err) {
    console.error(" Email Error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;