const express = require('express');
const router = express.Router();
const db = require('../database/db');
const fs = require('fs');
const path = require('path');

// In-memory storage for extended settings
let roomTypes = [
  { id: 'standard', label: 'Standard', price: 60000, color: '#3b82f6', beds: '1 Queen Bed', maxGuests: 2, sqft: 280, amenities: ['WiFi', 'TV', 'AC', 'Safe'] },
  { id: 'deluxe', label: 'Deluxe', price: 95000, color: '#8b5cf6', beds: '1 King Bed', maxGuests: 2, sqft: 380, amenities: ['WiFi', 'TV', 'AC', 'Safe', 'Minibar', 'Bathtub'] },
  { id: 'suite', label: 'Suite', price: 160000, color: '#D4AF37', beds: 'King + Living', maxGuests: 4, sqft: 600, amenities: ['WiFi', 'TV', 'AC', 'Safe', 'Minibar', 'Jacuzzi', 'Lounge'] },
  { id: 'executive', label: 'Executive', price: 125000, color: '#22c55e', beds: '1 King Bed', maxGuests: 2, sqft: 450, amenities: ['WiFi', 'TV', 'AC', 'Safe', 'Minibar', 'Work Desk', 'City View'] }
];

let paymentMethods = [
  { id: 'cash', label: 'Cash', enabled: true, icon: '💵' },
  { id: 'card', label: 'Credit/Debit Card', enabled: true, icon: '💳' },
  { id: 'transfer', label: 'Bank Transfer', enabled: true, icon: '🏦' },
  { id: 'pos', label: 'POS Terminal', enabled: true, icon: '📱' },
  { id: 'mobile', label: 'Mobile Payment', enabled: false, icon: '📲' }
];

let notificationSettings = {
  emailEnabled: true,
  smsEnabled: true,
  sendBookingConfirmation: true,
  sendCheckinReminder: true,
  sendCheckoutReminder: true,
  sendPaymentReceipt: true,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smsApiKey: '',
  smsSender: 'GrandHotel'
};

let hotelPolicies = {
  cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
  depositPolicy: '50% deposit required for bookings over 3 nights',
  smokingPolicy: 'No smoking in rooms. Designated areas available.',
  petPolicy: 'Pets are not allowed in the hotel.',
  earlyCheckinFee: 25000,
  lateCheckoutFee: 40000,
  extraBedFee: 15000,
  breakfastPrice: 15000,
  wifiPassword: 'GrandGuest2025'
};


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

// ═══════════════════════════════════════════════════════════
// ROOM TYPES MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Get all room types
router.get('/room-types', (req, res) => {
  res.json(roomTypes);
});

// Get single room type
router.get('/room-types/:id', (req, res) => {
  const roomType = roomTypes.find(rt => rt.id === req.params.id);
  if (!roomType) {
    return res.status(404).json({ error: 'Room type not found' });
  }
  res.json(roomType);
});

// Create new room type
router.post('/room-types', (req, res) => {
  const { id, label, price, color, beds, maxGuests, sqft, amenities } = req.body;
  
  if (!id || !label || !price) {
    return res.status(400).json({ error: 'ID, label, and price are required' });
  }
  
  if (roomTypes.find(rt => rt.id === id)) {
    return res.status(400).json({ error: 'Room type with this ID already exists' });
  }
  
  const newRoomType = {
    id,
    label,
    price: Number(price),
    color: color || '#3b82f6',
    beds: beds || '1 Bed',
    maxGuests: maxGuests || 2,
    sqft: sqft || 300,
    amenities: amenities || ['WiFi', 'TV', 'AC']
  };
  
  roomTypes.push(newRoomType);
  res.status(201).json({ message: 'Room type created successfully', roomType: newRoomType });
});

// Update room type
router.put('/room-types/:id', (req, res) => {
  const { id } = req.params;
  const { label, price, color, beds, maxGuests, sqft, amenities } = req.body;
  
  const index = roomTypes.findIndex(rt => rt.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Room type not found' });
  }
  
  roomTypes[index] = {
    ...roomTypes[index],
    label: label || roomTypes[index].label,
    price: price !== undefined ? Number(price) : roomTypes[index].price,
    color: color || roomTypes[index].color,
    beds: beds || roomTypes[index].beds,
    maxGuests: maxGuests !== undefined ? Number(maxGuests) : roomTypes[index].maxGuests,
    sqft: sqft !== undefined ? Number(sqft) : roomTypes[index].sqft,
    amenities: amenities || roomTypes[index].amenities
  };
  
  res.json({ message: 'Room type updated successfully', roomType: roomTypes[index] });
});

// Delete room type
router.delete('/room-types/:id', (req, res) => {
  const { id } = req.params;
  const index = roomTypes.findIndex(rt => rt.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Room type not found' });
  }
  
  roomTypes.splice(index, 1);
  res.json({ message: 'Room type deleted successfully' });
});

// ═══════════════════════════════════════════════════════════
// PAYMENT METHODS MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Get all payment methods
router.get('/payment-methods', (req, res) => {
  res.json(paymentMethods);
});

// Update payment method
router.put('/payment-methods/:id', (req, res) => {
  const { id } = req.params;
  const { enabled, label, icon } = req.body;
  
  const method = paymentMethods.find(pm => pm.id === id);
  if (!method) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  
  if (enabled !== undefined) method.enabled = enabled;
  if (label) method.label = label;
  if (icon) method.icon = icon;
  
  res.json({ message: 'Payment method updated successfully', paymentMethod: method });
});

// Add new payment method
router.post('/payment-methods', (req, res) => {
  const { id, label, icon, enabled } = req.body;
  
  if (!id || !label) {
    return res.status(400).json({ error: 'ID and label are required' });
  }
  
  if (paymentMethods.find(pm => pm.id === id)) {
    return res.status(400).json({ error: 'Payment method already exists' });
  }
  
  const newMethod = { id, label, icon: icon || '💰', enabled: enabled !== undefined ? enabled : true };
  paymentMethods.push(newMethod);
  
  res.status(201).json({ message: 'Payment method created successfully', paymentMethod: newMethod });
});

// Delete payment method
router.delete('/payment-methods/:id', (req, res) => {
  const { id } = req.params;
  const index = paymentMethods.findIndex(pm => pm.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  
  paymentMethods.splice(index, 1);
  res.json({ message: 'Payment method deleted successfully' });
});

// ═══════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════

// Get notification settings
router.get('/notifications', (req, res) => {
  res.json(notificationSettings);
});

// Update notification settings
router.put('/notifications', (req, res) => {
  const updates = req.body;
  
  Object.keys(updates).forEach(key => {
    if (key in notificationSettings) {
      notificationSettings[key] = updates[key];
    }
  });
  
  res.json({ message: 'Notification settings updated successfully', settings: notificationSettings });
});

// Test email configuration
router.post('/notifications/test-email', (req, res) => {
  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  
  // In a real implementation, you would send a test email here
  // For now, we'll just simulate success
  res.json({ success: true, message: `Test email would be sent to ${to}` });
});

// Test SMS configuration
router.post('/notifications/test-sms', (req, res) => {
  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  // In a real implementation, you would send a test SMS here
  res.json({ success: true, message: `Test SMS would be sent to ${to}` });
});

// ═══════════════════════════════════════════════════════════
// HOTEL POLICIES
// ═══════════════════════════════════════════════════════════

// Get hotel policies
router.get('/policies', (req, res) => {
  res.json(hotelPolicies);
});

// Update hotel policies
router.put('/policies', (req, res) => {
  const updates = req.body;
  
  Object.keys(updates).forEach(key => {
    if (key in hotelPolicies) {
      hotelPolicies[key] = updates[key];
    }
  });
  
  res.json({ message: 'Hotel policies updated successfully', policies: hotelPolicies });
});

// ═══════════════════════════════════════════════════════════
// ALL SETTINGS (Combined)
// ═══════════════════════════════════════════════════════════

// Get all extended settings
router.get('/extended/all', (req, res) => {
  res.json({
    roomTypes,
    paymentMethods,
    notificationSettings,
    hotelPolicies
  });
});

module.exports = router;
