const express = require('express');
const router = express.Router();
const WasteRequest = require('../models/WasteRequest');

// 1. [User] Submit Waste Pickup Request
router.post('/create', async (req, res) => {
  try {
    const { userId, wasteType, amount, location, pickupDate } = req.body;
    
    const newRequest = new WasteRequest({
      userId,
      wasteType,
      amount,
      location,
      pickupDate,
      status: 'Pending' 
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request stored in DB', request: newRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. [Admin] View all requests (Admin Dashboard)
router.get('/all', async (req, res) => {
  try {
    const requests = await WasteRequest.find().populate('userId', 'name email');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. [Admin] Approve & Assign Collector
router.put('/assign/:id', async (req, res) => {
  try {
    const { collectorId } = req.body; 
    const updatedRequest = await WasteRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Assigned', assignedCollectorId: collectorId },
      { new: true }
    );
    res.json({ message: 'Collector Assigned', request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/collector/:collectorId', async (req, res) => {
  try {
    const tasks = await WasteRequest.find({ 
      assignedCollectorId: req.params.collectorId 
    }).sort({ createdAt: -1 }); 
    
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/complete/:id', async (req, res) => {
  try {
    const updatedRequest = await WasteRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed' },
      { new: true }
    );
    res.json({ message: 'Waste Collected & DB Updated', request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/requests/stats - Returns grouped data for charts
router.get('/stats', async (req, res) => {
  try {
    const stats = await WasteRequest.aggregate([
      {
        $group: {
          _id: "$wasteType",   
          count: { $sum: 1 }   
        }
      }
    ]);


    const formattedStats = stats.map(item => ({
      name: item._id,
      value: item.count
    }));

    res.json(formattedStats);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get('/user/:userId', async (req, res) => {
  try {
    const requests = await WasteRequest.find({ userId: req.params.userId });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// [User] Feedback
router.put('/feedback/:id', async (req, res) => {
  try {
    const { feedback } = req.body;
    const updatedRequest = await WasteRequest.findByIdAndUpdate(
      req.params.id,
      { feedback },
      { new: true }
    );
    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/reject/:id', async (req, res) => {
  try {
    const updatedRequest = await WasteRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Rejected', 
        assignedCollectorId: null 
      },
      { new: true }
    );
    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// failure  report by the colletor scenario:
router.put('/report-issue/:id', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const updatedRequest = await WasteRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Rejected', 
        feedback: `Collection Failed: ${reason}` 
      },
      { new: true }
    );
    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete('/delete/:id', async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id);
    
    // Security Check: Only allow if status is Pending
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: "Cannot cancel request after it has been assigned." });
    }

    await WasteRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Request Cancelled Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;