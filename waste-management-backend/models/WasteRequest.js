const mongoose = require('mongoose');

const WasteRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, required: true },
  amount: { type: String, required: true }, 
  location: { type: String, required: true },
  pickupDate: { type: Date, required: true },
  
  // This tracks the flowchart status
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'Rejected', 'Completed'], 
    default: 'Pending' 
  },

  assignedCollectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  feedback: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WasteRequest', WasteRequestSchema);