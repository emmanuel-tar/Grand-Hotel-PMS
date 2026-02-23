const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Generate order number
function generateOrderNumber() {
  const date = new Date();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${hour}${minute}-${random}`;
}

// Get all orders
router.get('/', (req, res) => {
  const status = req.query.status || '';
  let query = `
    SELECT ro.*, g.name as guest_name
    FROM restaurant_orders ro
    LEFT JOIN guests g ON ro.guest_id = g.id
  `;
  let params = [];
  
  if (status) {
    query += ' WHERE ro.status = ?';
    params = [status];
  }
  
  query += ' ORDER BY ro.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse JSON items
    rows = rows.map(row => ({
      ...row,
      items: row.items ? JSON.parse(row.items) : []
    }));
    res.json(rows);
  });
});

// Get single order
router.get('/:id', (req, res) => {
  db.get(
    `SELECT ro.*, g.name as guest_name
     FROM restaurant_orders ro
     LEFT JOIN guests g ON ro.guest_id = g.id
     WHERE ro.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Order not found' });
      }
      row.items = row.items ? JSON.parse(row.items) : [];
      res.json(row);
    }
  );
});

// Create order
router.post('/', (req, res) => {
  const { table_number, guest_id, items, subtotal, tax, total } = req.body;
  const order_number = generateOrderNumber();
  
  db.run(
    `INSERT INTO restaurant_orders (order_number, table_number, guest_id, items, subtotal, tax, total, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [order_number, table_number, guest_id, JSON.stringify(items), subtotal, tax, total, 'pending'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, order_number, message: 'Order created successfully' });
    }
  );
});

// Update order status
router.put('/:id', (req, res) => {
  const { status } = req.body;
  
  db.run(
    'UPDATE restaurant_orders SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Order updated successfully' });
    }
  );
});

// Delete order
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM restaurant_orders WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Order deleted successfully' });
  });
});

// Get today's orders
router.get('/today/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT * FROM restaurant_orders WHERE DATE(created_at) = ?`,
    [today],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const totalRevenue = rows.reduce((sum, row) => sum + (row.total || 0), 0);
      const totalOrders = rows.length;
      const pendingOrders = rows.filter(row => row.status === 'pending').length;
      
      res.json({
        totalOrders,
        pendingOrders,
        totalRevenue,
        orders: rows
      });
    }
  );
});

module.exports = router;
