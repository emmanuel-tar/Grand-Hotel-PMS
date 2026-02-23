const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all staff
router.get('/', (req, res) => {
  db.all('staff', '', [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get single staff
router.get('/:id', (req, res) => {
  db.get('staff', '', [parseInt(req.params.id)], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ error: 'Staff not found' });
    res.json(result);
  });
});

// Add new staff
router.post('/', (req, res) => {
  const { name, role, email, phone, salary, hire_date, status } = req.body;
  
  if (!name || !role || !phone || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = 'INSERT INTO staff (name, role, email, phone, salary, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run('staff', query, [name, role, email, phone, salary || 0, hire_date || new Date().toISOString().split('T')[0], status || 'active'], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.lastID, message: 'Staff added successfully' });
  });
});

// Update staff
router.put('/:id', (req, res) => {
  const { name, role, email, phone, salary, hire_date, status } = req.body;
  const id = parseInt(req.params.id);
  
  const query = 'UPDATE staff SET name=?, role=?, email=?, phone=?, salary=?, hire_date=?, status=? WHERE id=?';
  db.update('staff', query, [name, role, email, phone, salary, hire_date, status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Staff updated successfully' });
  });
});

// Delete staff
router.delete('/:id', (req, res) => {
  db.delete('staff', '', [parseInt(req.params.id)], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Staff deleted successfully' });
  });
});

module.exports = router;
