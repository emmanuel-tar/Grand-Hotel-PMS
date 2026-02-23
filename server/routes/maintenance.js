const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all maintenance requests
router.get('/', (req, res) => {
  db.all('maintenance_requests', '', [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get single maintenance request
router.get('/:id', (req, res) => {
  db.get('maintenance_requests', '', [parseInt(req.params.id)], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json(result);
  });
});

// Add new maintenance request
router.post('/', (req, res) => {
  const { room_id, description, priority, status, reported_by, assigned_to } = req.body;
  
  if (!room_id || !description || !priority) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = 'INSERT INTO maintenance_requests (room_id, description, priority, status, reported_by, assigned_to) VALUES (?, ?, ?, ?, ?, ?)';
  db.run('maintenance_requests', query, [room_id, description, priority, status || 'pending', reported_by || 'System', assigned_to || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.lastID, message: 'Maintenance request created successfully' });
  });
});

// Update maintenance request
router.put('/:id', (req, res) => {
  const { room_id, description, priority, status, reported_by, assigned_to, completed_at } = req.body;
  const id = parseInt(req.params.id);
  
  const query = 'UPDATE maintenance_requests SET room_id=?, description=?, priority=?, status=?, reported_by=?, assigned_to=?, completed_at=? WHERE id=?';
  db.update('maintenance_requests', query, [room_id, description, priority, status, reported_by, assigned_to, completed_at, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Maintenance request updated successfully' });
  });
});

// Delete maintenance request
router.delete('/:id', (req, res) => {
  db.delete('maintenance_requests', '', [parseInt(req.params.id)], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Maintenance request deleted successfully' });
  });
});

module.exports = router;
