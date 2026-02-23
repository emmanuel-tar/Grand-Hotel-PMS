const express = require('express');
const router = express.Router();
const db = require('../database/db');

// In-memory storage for room management enhancements
let roomInspections = [];
let roomMaintenanceSchedule = [];
let roomBlockings = [];
let roomConditionReports = [];

// Get all rooms
router.get('/', (req, res) => {
  const { floor, type, status } = req.query;
  let query = 'SELECT * FROM rooms';
  let conditions = [];
  let params = [];
  
  if (floor) {
    conditions.push('floor = ?');
    params.push(Number(floor));
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY number';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get rooms summary/statistics
router.get('/stats', (req, res) => {
  db.all('SELECT * FROM rooms', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const stats = {
      total: rows.length,
      available: rows.filter(r => r.status === 'available').length,
      occupied: rows.filter(r => r.status === 'occupied').length,
      reserved: rows.filter(r => r.status === 'reserved').length,
      maintenance: rows.filter(r => r.status === 'maintenance').length,
      blocked: roomBlockings.filter(b => b.status === 'active').length,
      byType: {},
      byFloor: {},
      occupancyRate: 0
    };
    
    rows.forEach(room => {
      if (!stats.byType[room.type]) {
        stats.byType[room.type] = { total: 0, available: 0, occupied: 0 };
      }
      stats.byType[room.type].total++;
      if (room.status === 'available') stats.byType[room.type].available++;
      if (room.status === 'occupied') stats.byType[room.type].occupied++;
      
      if (!stats.byFloor[room.floor]) {
        stats.byFloor[room.floor] = { total: 0, available: 0, occupied: 0 };
      }
      stats.byFloor[room.floor].total++;
      if (room.status === 'available') stats.byFloor[room.floor].available++;
      if (room.status === 'occupied') stats.byFloor[room.floor].occupied++;
    });
    
    stats.occupancyRate = rows.length > 0 
      ? Math.round((stats.occupied / rows.length) * 100) 
      : 0;
    
    res.json(stats);
  });
});

// Get rooms by floor
router.get('/floor/:floor', (req, res) => {
  db.all('SELECT * FROM rooms WHERE floor = ? ORDER BY number', [Number(req.params.floor)], (err, rows) => {
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

// Bulk create rooms
router.post('/bulk', (req, res) => {
  const { rooms } = req.body;
  
  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return res.status(400).json({ error: 'Rooms array is required' });
  }
  
  const results = { created: 0, errors: [] };
  let completed = 0;
  
  rooms.forEach((room, index) => {
    const { number, type, status, price, floor, amenities } = room;
    
    if (!number || !type) {
      results.errors.push({ index, error: 'Room number and type are required' });
      completed++;
      if (completed === rooms.length) {
        res.status(201).json(results);
      }
      return;
    }
    
    db.run(
      'INSERT INTO rooms (number, type, status, price, floor, amenities) VALUES (?, ?, ?, ?, ?, ?)',
      [number, type, status || 'available', price, floor || 1, JSON.stringify(amenities || [])],
      function(err) {
        completed++;
        if (err) {
          results.errors.push({ index, number, error: err.message });
        } else {
          results.created++;
        }
        
        if (completed === rooms.length) {
          res.status(201).json(results);
        }
      }
    );
  });
});

// Generate rooms for a floor
router.post('/generate-floor', (req, res) => {
  const { floor, startNum, count, type, price, amenities } = req.body;
  
  if (!floor || !count || !type) {
    return res.status(400).json({ error: 'Floor, count, and type are required' });
  }
  
  const start = startNum || 1;
  const results = { created: 0, rooms: [], errors: [] };
  let completed = 0;
  
  for (let i = 0; i < count; i++) {
    const roomNum = `${floor}${String(start + i).padStart(2, '0')}`;
    
    db.run(
      'INSERT INTO rooms (number, type, status, price, floor, amenities) VALUES (?, ?, ?, ?, ?, ?)',
      [roomNum, type, 'available', price, floor, JSON.stringify(amenities || [])],
      function(err) {
        completed++;
        if (err) {
          results.errors.push({ number: roomNum, error: err.message });
        } else {
          results.created++;
          results.rooms.push({ id: this.lastID, number: roomNum, type, floor });
        }
        
        if (completed === count) {
          res.status(201).json(results);
        }
      }
    );
  }
});

// Update room status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (available, occupied, maintenance, reserved)' });
  }
  
  db.run(
    'UPDATE rooms SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json({ message: 'Room status updated successfully', status });
    }
  );
});

// Bulk update status
router.patch('/bulk/status', (req, res) => {
  const { roomIds, status } = req.body;
  const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
  
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
    return res.status(400).json({ error: 'Room IDs array is required' });
  }
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }
  
  const placeholders = roomIds.map(() => '?').join(',');
  db.run(
    `UPDATE rooms SET status = ? WHERE id IN (${placeholders})`,
    [status, ...roomIds],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Rooms status updated successfully', updated: this.changes });
    }
  );
});

// Update room price
router.patch('/:id/price', (req, res) => {
  const { price } = req.body;
  
  if (price === undefined || price < 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }
  
  db.run(
    'UPDATE rooms SET price = ? WHERE id = ?',
    [price, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json({ message: 'Room price updated successfully', price });
    }
  );
});

// Bulk update prices by type
router.patch('/bulk/pricing', (req, res) => {
  const { type, price } = req.body;
  
  if (!type || price === undefined) {
    return res.status(400).json({ error: 'Type and price are required' });
  }
  
  db.run(
    'UPDATE rooms SET price = ? WHERE type = ?',
    [price, type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Prices updated successfully', updated: this.changes });
    }
  );
});

// Update room amenities
router.patch('/:id/amenities', (req, res) => {
  const { amenities } = req.body;
  
  if (!amenities || !Array.isArray(amenities)) {
    return res.status(400).json({ error: 'Amenities array is required' });
  }
  
  db.run(
    'UPDATE rooms SET amenities = ? WHERE id = ?',
    [JSON.stringify(amenities), req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json({ message: 'Room amenities updated successfully', amenities });
    }
  );
});

// Search rooms
router.get('/search/:query', (req, res) => {
  const query = `%${req.params.query}%`;
  
  db.all(
    'SELECT * FROM rooms WHERE number LIKE ? OR type LIKE ? OR CAST(floor AS TEXT) LIKE ? ORDER BY number',
    [query, query, query],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get available rooms by type
router.get('/available/:type', (req, res) => {
  db.all(
    'SELECT * FROM rooms WHERE type = ? AND status = ? ORDER BY number',
    [req.params.type, 'available'],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ═══════════════════════════════════════════════════════════
// ROOM MAINTENANCE SCHEDULING
// ═══════════════════════════════════════════════════════════

// Get maintenance schedule
router.get('/maintenance/schedule', (req, res) => {
  const { roomId, status, startDate, endDate } = req.query;
  let results = roomMaintenanceSchedule;
  
  if (roomId) {
    results = results.filter(m => m.roomId === Number(roomId));
  }
  if (status) {
    results = results.filter(m => m.status === status);
  }
  if (startDate) {
    results = results.filter(m => m.scheduledDate >= startDate);
  }
  if (endDate) {
    results = results.filter(m => m.scheduledDate <= endDate);
  }
  
  res.json(results.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)));
});

// Create maintenance schedule
router.post('/maintenance/schedule', (req, res) => {
  const { roomId, type, description, scheduledDate, estimatedDuration, assignedTo, priority } = req.body;
  
  if (!roomId || !type || !scheduledDate) {
    return res.status(400).json({ error: 'Room ID, type, and scheduled date are required' });
  }
  
  const schedule = {
    id: Date.now(),
    roomId: Number(roomId),
    type,
    description: description || '',
    scheduledDate,
    estimatedDuration: estimatedDuration || '1 hour',
    assignedTo: assignedTo || '',
    priority: priority || 'medium',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    completedAt: null,
    notes: ''
  };
  
  roomMaintenanceSchedule.push(schedule);
  res.status(201).json({ message: 'Maintenance scheduled successfully', schedule });
});

// Update maintenance schedule
router.put('/maintenance/schedule/:id', (req, res) => {
  const { id } = req.params;
  const index = roomMaintenanceSchedule.findIndex(m => m.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Maintenance schedule not found' });
  }
  
  roomMaintenanceSchedule[index] = {
    ...roomMaintenanceSchedule[index],
    ...req.body,
    id: roomMaintenanceSchedule[index].id,
    updatedAt: new Date().toISOString()
  };
  
  res.json({ message: 'Maintenance schedule updated', schedule: roomMaintenanceSchedule[index] });
});

// Complete maintenance schedule
router.patch('/maintenance/schedule/:id/complete', (req, res) => {
  const { id } = req.params;
  const { notes, cost } = req.body;
  const index = roomMaintenanceSchedule.findIndex(m => m.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Maintenance schedule not found' });
  }
  
  roomMaintenanceSchedule[index].status = 'completed';
  roomMaintenanceSchedule[index].completedAt = new Date().toISOString();
  roomMaintenanceSchedule[index].notes = notes || '';
  roomMaintenanceSchedule[index].cost = cost || 0;
  
  res.json({ message: 'Maintenance completed', schedule: roomMaintenanceSchedule[index] });
});

// Delete maintenance schedule
router.delete('/maintenance/schedule/:id', (req, res) => {
  const { id } = req.params;
  const index = roomMaintenanceSchedule.findIndex(m => m.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Maintenance schedule not found' });
  }
  
  roomMaintenanceSchedule.splice(index, 1);
  res.json({ message: 'Maintenance schedule deleted' });
});

// ═══════════════════════════════════════════════════════════
// ROOM INSPECTIONS
// ═══════════════════════════════════════════════════════════

// Get room inspections
router.get('/inspections', (req, res) => {
  const { roomId, status, inspector } = req.query;
  let results = roomInspections;
  
  if (roomId) {
    results = results.filter(i => i.roomId === Number(roomId));
  }
  if (status) {
    results = results.filter(i => i.status === status);
  }
  if (inspector) {
    results = results.filter(i => i.inspector.toLowerCase().includes(inspector.toLowerCase()));
  }
  
  res.json(results.sort((a, b) => new Date(b.inspectedAt) - new Date(a.inspectedAt)));
});

// Create room inspection
router.post('/inspections', (req, res) => {
  const { roomId, inspector, items, overallCondition, notes, photos } = req.body;
  
  if (!roomId || !inspector) {
    return res.status(400).json({ error: 'Room ID and inspector are required' });
  }
  
  const inspection = {
    id: Date.now(),
    roomId: Number(roomId),
    inspector,
    items: items || [],
    overallCondition: overallCondition || 'good',
    notes: notes || '',
    photos: photos || [],
    status: 'completed',
    inspectedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  roomInspections.push(inspection);
  res.status(201).json({ message: 'Inspection recorded successfully', inspection });
});

// Get inspection by ID
router.get('/inspections/:id', (req, res) => {
  const inspection = roomInspections.find(i => i.id === Number(req.params.id));
  
  if (!inspection) {
    return res.status(404).json({ error: 'Inspection not found' });
  }
  
  res.json(inspection);
});

// Delete inspection
router.delete('/inspections/:id', (req, res) => {
  const { id } = req.params;
  const index = roomInspections.findIndex(i => i.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Inspection not found' });
  }
  
  roomInspections.splice(index, 1);
  res.json({ message: 'Inspection deleted' });
});

// ═══════════════════════════════════════════════════════════
// ROOM CONDITION REPORTS
// ═══════════════════════════════════════════════════════════

// Get room condition reports
router.get('/condition-reports', (req, res) => {
  const { roomId, status, severity } = req.query;
  let results = roomConditionReports;
  
  if (roomId) {
    results = results.filter(r => r.roomId === Number(roomId));
  }
  if (status) {
    results = results.filter(r => r.status === status);
  }
  if (severity) {
    results = results.filter(r => r.severity === severity);
  }
  
  res.json(results.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)));
});

// Create room condition report
router.post('/condition-reports', (req, res) => {
  const { roomId, issue, description, severity, reportedBy, location, photos } = req.body;
  
  if (!roomId || !issue) {
    return res.status(400).json({ error: 'Room ID and issue description are required' });
  }
  
  const report = {
    id: Date.now(),
    roomId: Number(roomId),
    issue,
    description: description || '',
    severity: severity || 'medium',
    reportedBy: reportedBy || 'System',
    location: location || '',
    photos: photos || [],
    status: 'open',
    resolvedAt: null,
    resolutionNotes: '',
    reportedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  roomConditionReports.push(report);
  res.status(201).json({ message: 'Condition report created successfully', report });
});

// Update condition report
router.put('/condition-reports/:id', (req, res) => {
  const { id } = req.params;
  const index = roomConditionReports.findIndex(r => r.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Condition report not found' });
  }
  
  roomConditionReports[index] = {
    ...roomConditionReports[index],
    ...req.body,
    id: roomConditionReports[index].id,
    updatedAt: new Date().toISOString()
  };
  
  res.json({ message: 'Condition report updated', report: roomConditionReports[index] });
});

// Resolve condition report
router.patch('/condition-reports/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { resolutionNotes, resolvedBy } = req.body;
  const index = roomConditionReports.findIndex(r => r.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Condition report not found' });
  }
  
  roomConditionReports[index].status = 'resolved';
  roomConditionReports[index].resolvedAt = new Date().toISOString();
  roomConditionReports[index].resolutionNotes = resolutionNotes || '';
  roomConditionReports[index].resolvedBy = resolvedBy || 'System';
  
  res.json({ message: 'Condition report resolved', report: roomConditionReports[index] });
});

// Delete condition report
router.delete('/condition-reports/:id', (req, res) => {
  const { id } = req.params;
  const index = roomConditionReports.findIndex(r => r.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Condition report not found' });
  }
  
  roomConditionReports.splice(index, 1);
  res.json({ message: 'Condition report deleted' });
});

// ═══════════════════════════════════════════════════════════
// ROOM BLOCKING MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Get room blockings
router.get('/blockings', (req, res) => {
  const { roomId, status, startDate, endDate } = req.query;
  let results = roomBlockings;
  
  if (roomId) {
    results = results.filter(b => b.roomId === Number(roomId));
  }
  if (status) {
    results = results.filter(b => b.status === status);
  }
  if (startDate) {
    results = results.filter(b => b.endDate >= startDate);
  }
  if (endDate) {
    results = results.filter(b => b.startDate <= endDate);
  }
  
  res.json(results.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
});

// Create room blocking
router.post('/blockings', (req, res) => {
  const { roomId, reason, startDate, endDate, blockedBy, notes } = req.body;
  
  if (!roomId || !reason || !startDate || !endDate) {
    return res.status(400).json({ error: 'Room ID, reason, start date, and end date are required' });
  }
  
  const blocking = {
    id: Date.now(),
    roomId: Number(roomId),
    reason,
    startDate,
    endDate,
    blockedBy: blockedBy || 'System',
    notes: notes || '',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  roomBlockings.push(blocking);
  res.status(201).json({ message: 'Room blocked successfully', blocking });
});

// Update room blocking
router.put('/blockings/:id', (req, res) => {
  const { id } = req.params;
  const index = roomBlockings.findIndex(b => b.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Room blocking not found' });
  }
  
  roomBlockings[index] = {
    ...roomBlockings[index],
    ...req.body,
    id: roomBlockings[index].id,
    updatedAt: new Date().toISOString()
  };
  
  res.json({ message: 'Room blocking updated', blocking: roomBlockings[index] });
});

// Cancel room blocking
router.patch('/blockings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const index = roomBlockings.findIndex(b => b.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Room blocking not found' });
  }
  
  roomBlockings[index].status = 'cancelled';
  roomBlockings[index].cancelledAt = new Date().toISOString();
  
  res.json({ message: 'Room blocking cancelled', blocking: roomBlockings[index] });
});

// Delete room blocking
router.delete('/blockings/:id', (req, res) => {
  const { id } = req.params;
  const index = roomBlockings.findIndex(b => b.id === Number(id));
  
