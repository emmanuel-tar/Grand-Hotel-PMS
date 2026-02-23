const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all inventory items
router.get('/', (req, res) => {
  const category = req.query.category || '';
  let query = 'SELECT * FROM inventory';
  let params = [];
  
  if (category) {
    query += ' WHERE category = ?';
    params = [category];
  }
  
  query += ' ORDER BY name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single item
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM inventory WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(row);
  });
});

// Create item
router.post('/', (req, res) => {
  const { name, category, quantity, unit, reorder_level, price, supplier } = req.body;
  
  db.run(
    'INSERT INTO inventory (name, category, quantity, unit, reorder_level, price, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category, quantity || 0, unit, reorder_level || 10, price, supplier],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Item created successfully' });
    }
  );
});

// Update item
router.put('/:id', (req, res) => {
  const { name, category, quantity, unit, reorder_level, price, supplier } = req.body;
  
  db.run(
    'UPDATE inventory SET name = ?, category = ?, quantity = ?, unit = ?, reorder_level = ?, price = ?, supplier = ? WHERE id = ?',
    [name, category, quantity, unit, reorder_level, price, supplier, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Item updated successfully' });
    }
  );
});

// Delete item
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM inventory WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Item deleted successfully' });
  });
});

// Get low stock items
router.get('/alerts/low-stock', (req, res) => {
  db.all(
    'SELECT * FROM inventory WHERE quantity <= reorder_level ORDER BY quantity',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
