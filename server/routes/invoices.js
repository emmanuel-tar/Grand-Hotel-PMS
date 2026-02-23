const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

// Get all invoices
router.get('/', (req, res) => {
  const status = req.query.status || '';
  let query = `
    SELECT i.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
           r.number as room_number, r.type as room_type
    FROM invoices i
    LEFT JOIN guests g ON i.guest_id = g.id
    LEFT JOIN bookings b ON i.booking_id = b.id
    LEFT JOIN rooms r ON b.room_id = r.id
  `;
  let params = [];
  
  if (status) {
    query += ' WHERE i.status = ?';
    params = [status];
  }
  
  query += ' ORDER BY i.created_at DESC';
  
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

// Get single invoice
router.get('/:id', (req, res) => {
  db.get(
    `SELECT i.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
            r.number as room_number, r.type as room_type
     FROM invoices i
     LEFT JOIN guests g ON i.guest_id = g.id
     LEFT JOIN bookings b ON i.booking_id = b.id
     LEFT JOIN rooms r ON b.room_id = r.id
     WHERE i.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      row.items = row.items ? JSON.parse(row.items) : [];
      res.json(row);
    }
  );
});

// Create invoice
router.post('/', (req, res) => {
  const { booking_id, guest_id, issue_date, due_date, items, subtotal, tax, total } = req.body;
  const invoice_number = generateInvoiceNumber();
  
  db.run(
    `INSERT INTO invoices (booking_id, guest_id, invoice_number, issue_date, due_date, items, subtotal, tax, total, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [booking_id, guest_id, invoice_number, issue_date, due_date, JSON.stringify(items), subtotal, tax, total, 'pending'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, invoice_number, message: 'Invoice created successfully' });
    }
  );
});

// Update invoice
router.put('/:id', (req, res) => {
  const { issue_date, due_date, items, subtotal, tax, total, status } = req.body;
  
  db.run(
    `UPDATE invoices SET issue_date = ?, due_date = ?, items = ?, subtotal = ?, tax = ?, total = ?, status = ? 
     WHERE id = ?`,
    [issue_date, due_date, JSON.stringify(items), subtotal, tax, total, status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Invoice updated successfully' });
    }
  );
});

// Mark invoice as paid
router.post('/:id/pay', (req, res) => {
  db.run(
    'UPDATE invoices SET status = ? WHERE id = ?',
    ['paid', req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Invoice marked as paid' });
    }
  );
});

// Delete invoice
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM invoices WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Invoice deleted successfully' });
  });
});

module.exports = router;
