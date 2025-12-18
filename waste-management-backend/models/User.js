const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  role: { 
    type: String, 
    enum: ['user', 'admin', 'collector'], 
    default: 'user' 
  },
  location: { type: String },

  // 👇 NEW FIELDS ADDED HERE 👇
  collectorStatus: { type: String, default: 'offline' }, // Stores 'online', 'offline', or 'leave'
  leaveDate: { type: Date, default: null },              // Stores return date if on leave
  lastUnloadTime: { type: Date, default: null }          // Tracks when they last emptied truck
  // 👆 END OF NEW FIELDS 👆
}, { timestamps: true }); // Added timestamps (optional, but good for tracking)

module.exports = mongoose.model('User', UserSchema);