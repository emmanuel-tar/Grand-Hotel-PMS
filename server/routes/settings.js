const express = require('express');
const router = express.Router();
const db = require('../database/db');
const fs = require('fs');
const path = require('path');

// Get all settings
router.get('/', (req, res) => {
  db.all('SELECT * FROM settings', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Convert array to key-value object
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  });
});

// Get single setting
router.get('/:key', (req, res) => {
  db.get('SELECT * FROM settings WHERE key = ?', [req.params.key], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(row);
  });
});

// Create or update setting
router.put('/:key', (req, res) => {
  const { value } = req.body;
  
  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [req.params.key, value],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Setting updated successfully' });
    }
  );
});

// Delete setting
router.delete('/:key', (req, res) => {
  db.run('DELETE FROM settings WHERE key = ?', [req.params.key], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Setting deleted successfully' });
  });
});

// Get printer settings (convenience endpoint)
router.get('/printer/config', (req, res) => {
  db.all('SELECT * FROM settings WHERE key LIKE "printer%"', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const printerSettings = {};
    rows.forEach(row => {
      printerSettings[row.key] = row.value;
    });
    res.json(printerSettings);
  });
});

// Update printer settings (convenience endpoint)
router.put('/printer/config', (req, res) => {
  const { printer_default, printer_paper_size, printer_orientation, printer_include_header } = req.body;
  
  const updates = [];
  const params = [];
  
  if (printer_default !== undefined) {
    updates.push('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    params.push('printer_default', printer_default);
  }
  if (printer_paper_size !== undefined) {
    updates.push('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    params.push('printer_paper_size', printer_paper_size);
  }
  if (printer_orientation !== undefined) {
    updates.push('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    params.push('printer_orientation', printer_orientation);
  }
  if (printer_include_header !== undefined) {
    updates.push('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    params.push('printer_include_header', printer_include_header);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No settings provided' });
  }
  
  // Execute all updates
  const promises = updates.map(query => {
    return new Promise((resolve, reject) => {
      db.run(query, params.slice(0, 2), function(err) {
        if (err) reject(err);
        else resolve();
      });
      params.splice(0, 2);
    });
  });
  
  Promise.all(promises)
    .then(() => res.json({ message: 'Printer settings updated successfully' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Backup database
router.post('/backup', (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../database/hotel-data.json');
    const backupDir = path.join(__dirname, '../database/backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `hotel-data-${timestamp}.json`);
    
    fs.copyFileSync(dbPath, backupPath);
    
    const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse();
    while (backups.length > 10) {
      const oldBackup = backups.pop();
      fs.unlinkSync(path.join(backupDir, oldBackup));
    }
    
    res.json({ success: true, message: 'Backup created successfully', backup: backupPath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export database
router.get('/export', (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../database/hotel-data.json');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=hotel-data-export.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import database
router.post('/import', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }
    
    const imported = typeof data === 'string' ? JSON.parse(data) : data;
    const requiredTables = ['users', 'rooms', 'guests', 'bookings', 'invoices', 'restaurant_orders', 'inventory', 'staff', 'maintenance_requests', 'settings'];
    
    for (const table of requiredTables) {
      if (!imported[table]) {
        imported[table] = table === 'settings' ? {} : [];
      }
    }
    
    const dbPath = path.join(__dirname, '../database/hotel-data.json');
    fs.writeFileSync(dbPath, JSON.stringify(imported, null, 2));
    
    res.json({ success: true, message: 'Data imported successfully. Please restart the server.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
