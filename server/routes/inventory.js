const express = require('express');
const router = express.Router();
const db = require('../database/db');

// In-memory storage for procurement
let suppliers = [
  { id: 1, name: 'Lagos Fresh Co.', email: 'sales@lagosfresh.com', phone: '08012345001', address: '15 Market Street, Lagos', category: 'fnb', rating: 4.5, active: true },
  { id: 2, name: 'Premium Meats', email: 'orders@premiummeats.com', phone: '08012345002', address: '22 Abattoir Road, Lagos', category: 'fnb', rating: 4.8, active: true },
  { id: 3, name: 'Ocean Fresh', email: 'seafood@oceanfresh.com', phone: '08012345003', address: '8 Harbor View, Lagos', category: 'fnb', rating: 4.3, active: true },
  { id: 4, name: 'Gourmet Pantry', email: 'supply@gourmetpantry.com', phone: '08012345004', address: '45 Industrial Layout, Ikeja', category: 'fnb', rating: 4.6, active: true },
  { id: 5, name: 'AquaPure', email: 'orders@aquapure.com', phone: '08012345005', address: '100 Water Works Road', category: 'beverage', rating: 4.4, active: true },
  { id: 6, name: 'Hygiene Pro', email: 'sales@hygienepro.com', phone: '08012345006', address: '30 Clean Street, Lagos', category: 'amenity', rating: 4.2, active: true },
  { id: 7, name: 'Textile House', email: 'orders@textilehouse.com', phone: '08012345007', address: '55 Fabric Lane, Lagos', category: 'linen', rating: 4.7, active: true },
  { id: 8, name: 'CleanPro', email: 'supply@cleanpro.com', phone: '08012345008', address: '88 Sanitation Way, Lagos', category: 'cleaning', rating: 4.1, active: true },
  { id: 9, name: 'Spirits Direct', email: 'orders@spiritsdirect.com', phone: '08012345009', address: '12 Distillery Road, Lagos', category: 'minibar', rating: 4.5, active: true },
  { id: 10, name: 'ElectroPlus', email: 'sales@electroplus.com', phone: '08012345010', address: '200 Electronics City, Lagos', category: 'maint', rating: 4.3, active: true }
];

let purchaseOrders = [];
let procurementHistory = [];
let supplierContracts = [];
let procurementApprovals = [];

// Supplier contract management
const supplierContractTypes = ['annual', 'quarterly', 'monthly', 'spot'];
const contractStatuses = ['draft', 'active', 'expired', 'terminated'];

// Inventory forecasting data
let inventoryForecasts = [];

// Get all inventory items
router.get('/', (req, res) => {
  const category = req.query.category || '';
  const lowStock = req.query.lowStock === 'true';
  const search = req.query.search || '';
  
  let query = 'SELECT * FROM inventory';
  let conditions = [];
  let params = [];
  
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  
  if (search) {
    conditions.push('(name LIKE ? OR supplier LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Filter low stock if requested
    let result = rows;
    if (lowStock) {
      result = rows.filter(item => item.quantity <= item.reorder_level);
    }
    
    res.json(result);
  });
});

// Get inventory statistics
router.get('/stats', (req, res) => {
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const stats = {
      totalItems: rows.length,
      totalValue: rows.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
      lowStock: rows.filter(i => i.quantity <= i.reorder_level).length,
      outOfStock: rows.filter(i => i.quantity === 0).length,
      byCategory: {},
      recentProcurements: procurementHistory.slice(-5)
    };
    
    rows.forEach(item => {
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = { count: 0, value: 0, lowStock: 0 };
      }
      stats.byCategory[item.category].count++;
      stats.byCategory[item.category].value += item.quantity * item.unit_price;
      if (item.quantity <= item.reorder_level) {
        stats.byCategory[item.category].lowStock++;
      }
    });
    
    res.json(stats);
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

// ═══════════════════════════════════════════════════════════
// SUPPLIERS MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Get all suppliers
router.get('/suppliers', (req, res) => {
  const { category, active } = req.query;
  let result = suppliers;
  
  if (category) {
    result = result.filter(s => s.category === category);
  }
  if (active !== undefined) {
    result = result.filter(s => s.active === (active === 'true'));
  }
  
  res.json(result);
});

// Get single supplier
router.get('/suppliers/:id', (req, res) => {
  const supplier = suppliers.find(s => s.id === Number(req.params.id));
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  res.json(supplier);
});

// Create supplier
router.post('/suppliers', (req, res) => {
  const { name, email, phone, address, category, rating } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newSupplier = {
    id: suppliers.length + 1,
    name,
    email,
    phone: phone || '',
    address: address || '',
    category: category || 'fnb',
    rating: rating || 0,
    active: true
  };
  
  suppliers.push(newSupplier);
  res.status(201).json({ message: 'Supplier created successfully', supplier: newSupplier });
});

// Update supplier
router.put('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const index = suppliers.findIndex(s => s.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  
  suppliers[index] = {
    ...suppliers[index],
    ...req.body,
    id: suppliers[index].id // Preserve ID
  };
  
  res.json({ message: 'Supplier updated successfully', supplier: suppliers[index] });
});

// Delete supplier
router.delete('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const index = suppliers.findIndex(s => s.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  
  suppliers.splice(index, 1);
  res.json({ message: 'Supplier deleted successfully' });
});

// ═══════════════════════════════════════════════════════════
// PURCHASE ORDERS (PROCUREMENT)
// ═══════════════════════════════════════════════════════════

// Get all purchase orders
router.get('/purchase-orders', (req, res) => {
  const { status, supplier } = req.query;
  let result = purchaseOrders;
  
  if (status) {
    result = result.filter(po => po.status === status);
  }
  if (supplier) {
    result = result.filter(po => po.supplierName === supplier);
  }
  
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Get single purchase order
router.get('/purchase-orders/:id', (req, res) => {
  const po = purchaseOrders.find(p => p.id === req.params.id);
  if (!po) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  res.json(po);
});

// Create purchase order
router.post('/purchase-orders', (req, res) => {
  const { supplierId, items, notes, expectedDelivery, createdBy } = req.body;
  
  const supplier = suppliers.find(s => s.id === supplierId);
  if (!supplier) {
    return res.status(400).json({ error: 'Invalid supplier' });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }
  
  const orderItems = items.map(item => ({
    inventoryId: item.inventoryId,
    name: item.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    total: Number(item.quantity) * Number(item.unitPrice)
  }));
  
  const total = orderItems.reduce((sum, item) => sum + item.total, 0);
  
  const purchaseOrder = {
    id: `PO-${Date.now().toString().slice(-8)}`,
    supplierId,
    supplierName: supplier.name,
    items: orderItems,
    total,
    status: 'pending',
    notes: notes || '',
    expectedDelivery: expectedDelivery || '',
    createdBy: createdBy || 'Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  purchaseOrders.push(purchaseOrder);
  res.status(201).json({ message: 'Purchase order created successfully', purchaseOrder });
});

// Update purchase order status
router.patch('/purchase-orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status required' });
  }
  
  const poIndex = purchaseOrders.findIndex(p => p.id === req.params.id);
  if (poIndex === -1) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  
  const po = purchaseOrders[poIndex];
  
  // If receiving items, update inventory
  if (status === 'received' && po.status !== 'received') {
    po.items.forEach(item => {
      db.run(
        'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
        [item.quantity, item.inventoryId],
        function(err) {
          if (err) console.error('Error updating inventory:', err);
        }
      );
    });
    
    // Add to procurement history
    procurementHistory.push({
      id: Date.now(),
      poId: po.id,
      supplier: po.supplierName,
      items: po.items,
      total: po.total,
      receivedAt: new Date().toISOString()
    });
  }
  
  po.status = status;
  po.updatedAt = new Date().toISOString();
  
  res.json({ message: 'Purchase order status updated', purchaseOrder: po });
});

// Delete purchase order
router.delete('/purchase-orders/:id', (req, res) => {
  const index = purchaseOrders.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  
  const po = purchaseOrders[index];
  if (po.status === 'received') {
    return res.status(400).json({ error: 'Cannot delete received orders' });
  }
  
  purchaseOrders.splice(index, 1);
  res.json({ message: 'Purchase order deleted successfully' });
});

// ═══════════════════════════════════════════════════════════
// STOCK ADJUSTMENTS
// ═══════════════════════════════════════════════════════════

// Adjust stock (increase or decrease)
router.post('/:id/adjust', (req, res) => {
  const { id } = req.params;
  const { quantity, reason, reference, adjustedBy } = req.body;
  
  if (quantity === undefined || quantity === 0) {
    return res.status(400).json({ error: 'Quantity adjustment is required' });
  }
  
  db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const newQty = Math.max(0, item.quantity + quantity);
    
    db.run(
      'UPDATE inventory SET quantity = ? WHERE id = ?',
      [newQty, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Record adjustment in procurement history
        procurementHistory.push({
          id: Date.now(),
          type: 'adjustment',
          inventoryId: id,
          itemName: item.name,
          previousQty: item.quantity,
          adjustment: quantity,
          newQty,
          reason: reason || 'Stock adjustment',
          reference: reference || '',
          adjustedBy: adjustedBy || 'Admin',
          adjustedAt: new Date().toISOString()
        });
        
        res.json({
          message: 'Stock adjusted successfully',
          previousQty: item.quantity,
          adjustment: quantity,
          newQty
        });
      }
    );
  });
});

// ═══════════════════════════════════════════════════════════
// PROCUREMENT HISTORY
// ═══════════════════════════════════════════════════════════

// Get procurement history
router.get('/procurement/history', (req, res) => {
  const { type, limit } = req.query;
  let result = procurementHistory;
  
  if (type) {
    result = result.filter(h => h.type === type);
  }
  
  result = result.sort((a, b) => new Date(b.adjustedAt || b.receivedAt) - new Date(a.adjustedAt || a.receivedAt));
  
  if (limit) {
    result = result.slice(0, Number(limit));
  }
  
  res.json(result);
});

// ═══════════════════════════════════════════════════════════
// REORDER SUGGESTIONS
// ═══════════════════════════════════════════════════════════

// Get suggested reorder items
router.get('/reorder/suggestions', (req, res) => {
  db.all('SELECT * FROM inventory WHERE quantity <= reorder_level', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const suggestions = rows.map(item => {
      const suggestedQty = Math.max(item.reorder_level * 2 - item.quantity, item.reorder_level);
      return {
        ...item,
        suggestedOrderQty: suggestedQty,
        estimatedCost: suggestedQty * item.unit_price,
        urgency: item.quantity === 0 ? 'critical' : item.quantity <= item.reorder_level / 2 ? 'high' : 'normal'
      };
    });
    
    res.json(suggestions);
  });
});

// Create purchase order from suggestions
router.post('/reorder/auto-create', (req, res) => {
  const { items, createdBy } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }
  
  // Group by supplier
  const bySupplier = {};
  
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const inventoryMap = {};
    rows.forEach(item => {
      inventoryMap[item.id] = item;
    });
    
    items.forEach(item => {
      const inv = inventoryMap[item.inventoryId];
      if (inv) {
        if (!bySupplier[inv.supplier]) {
          bySupplier[inv.supplier] = [];
        }
        bySupplier[inv.supplier].push({
          inventoryId: inv.id,
          name: inv.name,
          quantity: item.quantity || inv.reorder_level * 2,
          unitPrice: inv.unit_price
        });
      }
    });
    
    const createdOrders = [];
    Object.entries(bySupplier).forEach(([supplierName, orderItems]) => {
      const supplier = suppliers.find(s => s.name === supplierName);
      const total = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      
      const purchaseOrder = {
        id: `PO-${Date.now().toString().slice(-8)}-${createdOrders.length}`,
        supplierId: supplier?.id || 0,
        supplierName: supplierName,
        items: orderItems.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice
        })),
        total,
        status: 'pending',
        notes: 'Auto-generated from reorder suggestions',
        createdBy: createdBy || 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      purchaseOrders.push(purchaseOrder);
      createdOrders.push(purchaseOrder);
    });
    
    res.status(201).json({
      message: `${createdOrders.length} purchase order(s) created`,
      orders: createdOrders
    });
  });
});

// ═══════════════════════════════════════════════════════════
// SUPPLIER CONTRACTS MANAGEMENT
// ════════════════════════════════════════════════════════

// Get supplier contracts
router.get('/contracts', (req, res) => {
  const { supplierId, status } = req.query;
  let result = supplierContracts;
  
  if (supplierId) {
    result = result.filter(c => c.supplierId === Number(supplierId));
  }
  if (status) {
    result = result.filter(c => c.status === status);
  }
  
  res.json(result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
});

// Create supplier contract
router.post('/contracts', (req, res) => {
  const { supplierId, type, value, startDate, endDate, terms } = req.body;
  
  if (!supplierId || !type || !startDate || !endDate) {
    return res.status(400).json({ error: 'Supplier ID, type, start date and end date are required' });
  }
  
  const contract = {
    id: Date.now(),
    supplierId: Number(supplierId),
    type,
    value: value || 0,
    startDate,
    endDate,
    terms: terms || '',
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  
  supplierContracts.push(contract);
res.status(201).json({ message:'Contract created successfully', contract});
});

// Update contract status
router.patch('/contracts/:id/status', (req.res)=>{
const{status}=req.body;
const index=supplierContracts.findIndex(c=>c.id===Number(req.params.id));
if(index===-1){return res.status(404).json({error:'Contract not found'});}
supplierContracts[index].status=status;
res.json({message:'Contract updated',contract:supplierContracts[index]});
});

// Delete contract
router.delete('/contracts/:id',(req.res)=>{
const index=supplierContracts.findIndex(c=>c.id===Number(req.params.id));
if(index===-1){return res.status(404).json({error:'Contract not found'});}
supplierContracts.splice(index，1);
res.json({message:'Contract deleted'});
});

// ════════ PROCUREMENT APPROVAL WORKFLOWS ════════

// Get approval requests
router.get('/approvals',（Req，res）=>{
const{poId，status}=Req.query；
let result=procurementApprovals;

if（po Id）{result=result.filter（a=>a.po Id==po Id）；}
If(status){result=result.filter(a=>a.Status==Status);}

Res.json(result.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
});

// Create approval request 
Router.post（'/approvals'，（Req，res）=>{
Const{purchaseOrder Id，approverLevel，requestedBy}=REQ.body;

IF(!purchaseOrderID){
Return RES.STATUS（400）.JSON（{ERROR：'Purchase order ID is required'}）；
}

Const approval={
ID：DATE.NOW（），
purchaseOrderID，
ApproverLevel：approverLevel||1，
STATUS：'pending'，
RequestedBy：requestedBy||‘Admin’，
CreatedAT：NEW DATE（）。TOISOSTRING（），
ReviewedBY：NULL，
ReviewedAT：NULL };

ProcurementApprovals.push（approval）；
RES.STATUS（201）.JSON（MESSAGE：‘Approval request created’，approval）；
}）；

// Review/approve or reject 
Router.patch （'/approvals/:id/review' , （REQ , RES）=>{
CONST{id}=REQ.params；
CONST{action , reviewedBy , notes }=REQ.body; // action='approved'reject'
CONST INDEX=procurementApprovals.findIndex（A=>A.ID===NUMBER(ID));

IF(INDEX===-1）{RETURN RES.STATUS（404）.JSON.（ERROR：‘Approval not found】；}

procurementApprovals[INDEX].STATUS=
ACTION=='APPROVED'?‘approved': ‘rejected';
procurementApprovals[INDEX].reviewed By=
reviewed By|| ‘Manager’ ;
Procurement Approvals [index] . reviewed At =
New DATE() .toISOString();
ProcureMentapProvALS[INDEX].notes=

notes|| '';

RES.JSON（MESSAGE：`Approval ${action}`,
approval : procurement Appr OvalS [index]);
});


// ═════ INVENTORY FORECASTING ═════

// Generate forecast for an item 
Router.get ('/forecast/:item Id ', （REQ ，RES）＝＞{
db.all('SELECT * FROM inventory WHERE id=?',
【number(req.params.item.Id)],async(err.rows)=>{

IF(E RR){RETURN RES。STATUS。（500）。JSON.（ERROR:E RR.MESSAGE）；}
IF(!rows.length){RETURN RES。STATUS。（404）。JSON.（ERROR:"Item not found"};}
 Const item=rowS[0];
 // Simple moving average based on recent consumption假设过去30天平均消耗为 reorder level的10%
 Const avgConsumption=(item.reorder_level*0.1)*30; 
 Const daysUntilStockout=Math.floor(item.quantity/avgConsumption)||999;

Const forecast={
Item_id : item.id ,
Item_name : item.name ,
Current_quantity : item.quantity ,
Reorder_level : item.reorder_level ,
Avg_daily_consumption ： Math.round(avgConsumption*100)/100,
Days_until_stockout ：daysUntilStockout ,
Suggested_order_qty ： Math.max(item.reorder_level*2-item.quantity,o),
Recommended_order_date：
 New DATE(Date.now()+daysUntilStockout*86400000)
.toISOString().split('T')[o],
Urgency:
 Item.quantity<=item.reorder level?
   Item.quanti TY==O?'critical':'high':'normal'

};
inventoryForecasts.push(Forecast);
Res.json(ForeCAsT);

})})；

Get all forecasts 

ROUTER.GET ('/forecasts ', （REQ ，RES）＝＞{

 db.all('SELECT * FROM inventory ORDER BY name'.[],async(err.rows)=>{

 IF(E RR){ RETURN RES STATUS.(500), JSON ({ ERROR:E RR.message}); }

 CONST forecastsPromiseS=row S.map(async(item)=>{ 

   CONST avgConsumPtIon=(item.ReOrDer_leVel*.001)*30;  

   CONST days UntilStOCkOut=MATH.FLoor(Item.qUANTity/A vgconsumptIon)||999;

RETUrn {

ITEM_ID:

 ITEM.ID,

 ITEM_NAME :

ITEM.NAME,

CURRENT_QTY :

ITEM.QTY，

REORDER_LEVEL：

 ITEM.REORDER_LEVEL，

DAYS_UNTIL_STOCKOUT：

 DAYS UNTILST OCKOUT，

URGENCY:

ITEm.qUANTITY<=ITEM.REORDER LEVEL?

 ITem.qUANTITY==O?'CRITICAL':'HIGH':NORMAL'

};

 });

CON ST forecasts=AWAIT Promise.ALL(fOreCastSprOmiseS);

INVentoryForeCAsts=fOreCASTs；

Res.Json(fOreCASTs)； 

}});


module.exports=rOuter；
