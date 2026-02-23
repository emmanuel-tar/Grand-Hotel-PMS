const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all rooms
router.get('/', (req, res) => {
  db.all('SELECT * FROM rooms ORDER BY number', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single room
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM rooms WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(row);
  });
});

// Create room
router.post('/', (req, res) => {
  const { number, type, status, price, floor, amenities } = req.body;
  
  db.run(
    'INSERT INTO rooms (number, type, status, price, floor, amenities) VALUES (?, ?, ?, ?, ?, ?)',
    [number, type, status || 'available', price, floor, JSON.stringify(amenities || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Room created successfully' });
    }
  );
});

// Update room
router.put('/:id', (req, res) => {
  const { number, type, status, price, floor, amenities } = req.body;
  
  db.run(
    'UPDATE rooms SET number = ?, type = ?, status = ?, price = ?, floor = ?, amenities = ? WHERE id = ?',
    [number, type, status, price, floor, JSON.stringify(amenities || []), req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Room updated successfully' });
    }
  );
});

// Delete room
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM rooms WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Room deleted successfully' });
  });
});

// Get room availability
router.get('/availability/:checkIn/:checkOut', (req, res) => {
  const { checkIn, checkOut } = req.params;
  
  db.all(
    `SELECT r.* FROM rooms r 
     WHERE r.id NOT IN (
       SELECT b.room_id FROM bookings b 
       WHERE (b.check_in <= ? AND b.check_out >= ?)
       AND b.status != 'cancelled'
     ) 
     ORDER BY r.number`,
    [checkOut, checkIn],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
