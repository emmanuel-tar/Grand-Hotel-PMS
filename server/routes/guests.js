const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all guests
router.get('/', (req, res) => {
  const search = req.query.search || '';
  let query = 'SELECT * FROM guests';
  let params = [];
  
  if (search) {
    query += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single guest
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM guests WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json(row);
  });
});

// Create guest
router.post('/', (req, res) => {
  const { name, email, phone, address, id_type, id_number } = req.body;
  
  db.run(
    'INSERT INTO guests (name, email, phone, address, id_type, id_number) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone, address, id_type, id_number],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Guest created successfully' });
    }
  );
});

// Update guest
router.put('/:id', (req, res) => {
  const { name, email, phone, address, id_type, id_number, loyalty_points } = req.body;
  
  db.run(
    'UPDATE guests SET name = ?, email = ?, phone = ?, address = ?, id_type = ?, id_number = ?, loyalty_points = ? WHERE id = ?',
    [name, email, phone, address, id_type, id_number, loyalty_points || 0, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Guest updated successfully' });
    }
  );
});

// Delete guest
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM guests WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Guest deleted successfully' });
  });
});

// Get guest bookings
router.get('/:id/bookings', (req, res) => {
  db.all(
    `SELECT b.*, r.number as room_number, r.type as room_type 
     FROM bookings b 
     JOIN rooms r ON b.room_id = r.id 
     WHERE b.guest_id = ? 
     ORDER BY b.check_in DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
