const express = require('express');
const cors = require('cors');
const Datastore = require('nedb-promises');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Persistent Embedded JSON Datastores
const db = {
    items: Datastore.create({ filename: path.resolve(__dirname, 'data/items.db'), autoload: true }),
    bills: Datastore.create({ filename: path.resolve(__dirname, 'data/bills.db'), autoload: true }),
    workers: Datastore.create({ filename: path.resolve(__dirname, 'data/workers.db'), autoload: true }),
    leaves: Datastore.create({ filename: path.resolve(__dirname, 'data/leaves.db'), autoload: true }),
    credits: Datastore.create({ filename: path.resolve(__dirname, 'data/credits.db'), autoload: true }),
    shelves: Datastore.create({ filename: path.resolve(__dirname, 'data/shelves.db'), autoload: true }),
    wasteLog: Datastore.create({ filename: path.resolve(__dirname, 'data/wasteLog.db'), autoload: true }),
    settings: Datastore.create({ filename: path.resolve(__dirname, 'data/settings.db'), autoload: true })
};

// Automate Database Mock Seeding matching your local state models perfectly
async function seedDatabase() {
    if (await db.items.count({}) === 0) {
        await db.items.insert([
            { id: 1, name: 'Bread', qty: 45, price: 40, shelf: 'A1', dateAdded: '2025-12-05T00:00:00.000Z', expiryDate: '2025-12-16' }, 
            { id: 2, name: 'Cake', qty: 8, price: 250, shelf: 'B2', dateAdded: '2025-12-03T00:00:00.000Z', expiryDate: '2025-12-15' }, 
            { id: 3, name: 'Cookies', qty: 15, price: 80, shelf: 'A2', dateAdded: '2025-10-08T00:00:00.000Z', expiryDate: '2025-11-02' }, 
            { id: 4, name: 'Muffin Mix', qty: 5, price: 120, shelf: 'C1', dateAdded: '2025-08-28T00:00:00.000Z', expiryDate: '2025-09-02' }
        ]);
    }
    if (await db.workers.count({}) === 0) {
        await db.workers.insert([
            { id: 101, name: 'Manjunath', role: 'Baker' }, 
            { id: 102, name: 'Suresh', role: 'Helper'}
        ]);
    }
    if (await db.leaves.count({}) === 0) {
        await db.leaves.insert([
            { id: 1, workerId: 101, worker: 'Manjunath', type: 'Sick', startDate: '2025-11-23', endDate: '2025-11-24', status: 'Approved' }, 
            { id: 2, workerId: 102, worker: 'Suresh', type: 'Personal', startDate: '2025-12-20', endDate: '2025-12-21', status: 'Pending' }
        ]);
    }
    if (await db.credits.count({}) === 0) {
        await db.credits.insert([
            { id: 1, name: 'Ravi Kumar', amt: 450, issueDate: '2026-06-16', expiryDate: '2026-07-16', status: 'Not Paid' }, 
            { id: 2, name: 'Suma', amt: 120, issueDate: '2026-05-07', expiryDate: '2026-06-06', status: 'Not Paid' }
        ]);
    }
    if (await db.shelves.count({}) === 0) {
        await db.shelves.insert([
            { id: 'A1', items: ['Bread', 'Buns', 'Rolls'] },
            { id: 'B2', items: ['Cake', 'Pastries'] },
            { id: 'C1', items: ['Muffin Mix', 'Flour'] }
        ]);
    }
    if (await db.settings.count({}) === 0) {
        await db.settings.insert({ lang: 'kn', taxRate: 5 });
    }
}
seedDatabase().catch(console.error);

/* ==========================================================================
   1. BOOTSTRAP RESYNC ENDPOINT
   ========================================================================== */
app.get('/api/bootstrap', async (req, res) => {
    try {
        const items = await db.items.find({});
        const bills = await db.bills.find({});
        const workersList = await db.workers.find({});
        const leaves = await db.leaves.find({});
        const credits = await db.credits.find({});
        const rawShelves = await db.shelves.find({});
        const wasteLog = await db.wasteLog.find({});
        const settings = await db.settings.findOne({});

        const shelves = {};
        rawShelves.forEach(s => { shelves[s.id] = s.items; });

        res.json({
            items,
            bills,
            workersList,
            leaves,
            credits,
            shelves,
            wasteLog,
            lang: settings ? settings.lang : 'kn',
            taxRate: settings ? settings.taxRate : 5
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { lang, taxRate } = req.body;
        await db.settings.update({}, { $set: { lang, taxRate } }, { upsert: true });
        res.json({ success: true, lang, taxRate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================================================================
   2. INVENTORY & STOCK WASTAGE MANAGEMENT
   ========================================================================== */
app.post('/api/inventory/add', async (req, res) => {
    try {
        const { name, qty, price, shelf, expiryDate } = req.body;
        const shelfIdUpper = shelf.toUpperCase().trim();
        const itemNameClean = name.trim();
        const generatedId = Date.now(); 

        const newItem = {
            id: generatedId,
            name: itemNameClean,
            qty: parseInt(qty),
            price: parseFloat(price),
            shelf: shelfIdUpper,
            dateAdded: new Date().toISOString(),
            expiryDate: expiryDate
        };

        const insertedItem = await db.items.insert(newItem);

        const existingShelf = await db.shelves.findOne({ id: shelfIdUpper });
        if (existingShelf) {
            if (!existingShelf.items.some(n => n.toLowerCase() === itemNameClean.toLowerCase())) {
                await db.shelves.update({ id: shelfIdUpper }, { $push: { items: itemNameClean } });
            }
        } else {
            await db.shelves.insert({ id: shelfIdUpper, items: [itemNameClean] });
        }

        res.status(201).json(insertedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory/waste/:id', async (req, res) => {
    try {
        const itemId = parseInt(req.params.id); 
        const item = await db.items.findOne({ id: itemId });
        if (!item) return res.status(404).json({ error: 'Item record not found' });

        const wasteEntry = {
            ...item,
            id: `waste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            wasteDate: new Date().toISOString(),
            lossReason: 'Manual/Spoilage'
        };
        delete wasteEntry._id; 

        await db.wasteLog.insert(wasteEntry);
        await db.items.remove({ id: itemId });

        res.json({ success: true, wasteEntry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================================================================
   3. FIFO SALES BILL GENERATOR
   ========================================================================== */
app.post('/api/bills/generate', async (req, res) => {
    try {
        const { cart, subtotal, tax, total } = req.body;
        if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart empty' });

        let updatedItems = await db.items.find({});

        for (const soldItem of cart) {
            let remainingQty = soldItem.qty;

            let batches = updatedItems
                .filter(i => i.name.toLowerCase() === soldItem.name.toLowerCase())
                .sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

            for (let current of batches) {
                if (remainingQty <= 0) break;

                const isExpired = new Date(current.expiryDate).setHours(0,0,0,0) <= new Date().setHours(0,0,0,0);
                if (!isExpired) {
                    const deductQty = Math.min(current.qty, remainingQty);
                    current.qty -= deductQty;
                    remainingQty -= deductQty;

                    if (current.qty === 0) {
                        await db.items.remove({ id: current.id });
                    } else {
                        await db.items.update({ id: current.id }, { $set: { qty: current.qty } });
                    }
                }
            }
        }

        const billRecord = await db.bills.insert({
            id: Date.now(),
            items: cart,
            subtotal,
            tax,
            total,
            time: new Date().toLocaleString()
        });

        res.status(201).json(billRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================================================================
   4. CLIENT CREDIT TRACKING
   ========================================================================== */
app.post('/api/credits/add', async (req, res) => {
    try {
        const { name, amt, issueDate, expiryDate } = req.body;
        const newCredit = {
            id: Date.now(),
            name: name.trim(),
            amt: parseFloat(amt),
            issueDate: issueDate,
            expiryDate: expiryDate,
            status: 'Not Paid'
        };

        const record = await db.credits.insert(newCredit);
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/credits/:id/status', async (req, res) => {
    try {
        const creditId = parseInt(req.params.id);
        const { status } = req.body;
        await db.credits.update({ id: creditId }, { $set: { status } });
        res.json({ success: true, id: creditId, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================================================================
   5. WORKER MANAGEMENT DIRECTORY
   ========================================================================== */
app.post('/api/workers/add', async (req, res) => {
    try {
        const { name, role } = req.body;
        const worker = {
            id: Date.now(), 
            name: name.trim(),
            role: role.trim()
        };
        const savedWorker = await db.workers.insert(worker);
        res.status(201).json(savedWorker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/workers/:id', async (req, res) => {
    try {
        const workerId = parseInt(req.params.id);
        const { name, role } = req.body;

        await db.workers.update({ id: workerId }, { $set: { name: name.trim(), role: role.trim() } });
        await db.leaves.update({ workerId: workerId }, { $set: { worker: name.trim() } }, { multi: true });

        res.json({ success: true, id: workerId, name, role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================================================================
   6. ATTENDANCE & LEAVE HANDLERS
   ========================================================================== */
app.post('/api/leaves/apply', async (req, res) => {
    try {
        const { workerId, type, note, startDate, endDate } = req.body;
        const worker = await db.workers.findOne({ id: parseInt(workerId) });
        if (!worker) return res.status(404).json({ error: 'Worker profile missing' });

        const request = {
            id: Date.now(),
            workerId: parseInt(workerId),
            worker: worker.name,
            type: type.trim(),
            note: note ? note.trim() : '',
            startDate,
            endDate,
            status: 'Pending'
        };

        const leaveRequest = await db.leaves.insert(request);
        res.status(201).json(leaveRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/leaves/:id/action', async (req, res) => {
    try {
        const leaveId = parseInt(req.params.id);
        const { action } = req.body; 
        const status = action === 'approve' ? 'Approved' : 'Rejected';

        await db.leaves.update({ id: leaveId }, { $set: { status } });
        res.json({ success: true, id: leaveId, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================================================================
   7. SHELF CONFIGURATION
   ========================================================================== */
app.post('/api/shelves/add', async (req, res) => {
    try {
        const { id, items } = req.body;
        const shelfIdUpper = id.toUpperCase().trim();
        
        const existing = await db.shelves.findOne({ id: shelfIdUpper });
        if (existing) return res.status(400).json({ error: 'Shelf ID already exists!' });

        const itemsArray = items.split(',').map(i => i.trim()).filter(i => i.length);
        const record = await db.shelves.insert({ id: shelfIdUpper, items: itemsArray });
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/shelves/:oldId', async (req, res) => {
    try {
        const oldShelfId = req.params.oldId.toUpperCase().trim();
        const { newId, items } = req.body;
        const newIdUpper = newId.toUpperCase().trim();
        const itemsArray = items.split(',').map(i => i.trim()).filter(i => i.length);

        if (oldShelfId !== newIdUpper) {
            const collisionCheck = await db.shelves.findOne({ id: newIdUpper });
            if (collisionCheck) return res.status(400).json({ error: 'Target Shelf ID already exists!' });
            await db.shelves.remove({ id: oldShelfId });
        }

        await db.shelves.update({ id: newIdUpper }, { $set: { items: itemsArray } }, { upsert: true });
        res.json({ success: true, id: newIdUpper, items: itemsArray });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`[BSOMS Server]: Secure Engine online on port ${PORT}`);
});
