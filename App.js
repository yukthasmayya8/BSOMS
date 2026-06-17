import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

/* ====================
   Utils & Helpers
 ==================== */

/**
 * Formats date string or Date object to localized string (e.g., 'Dec 7, 2025').
 * @param {string|Date} date 
 * @returns {string}
 */
const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (d instanceof Date && !isNaN(d)) d.setHours(0, 0, 0, 0);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Checks if expiry date passed or is today.
 * @param {string} expiryDateString (YYYY-MM-DD)
 * @returns {boolean}
 */
const isExpired = (expiryDateString) => {
    if (!expiryDateString) return false;
    const today = new Date();
    const expiryDate = new Date(expiryDateString);
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate <= today;
};

/**
 * Returns a past date by subtracting units of months/days.
 * @param {number} unit 
 * @param {'days'|'months'} type 
 * @returns {Date}
 */
const getDateAgo = (unit, type = 'months') => {
    const d = new Date();
    if (type === 'months') d.setMonth(d.getMonth() - unit);
    else if (type === 'days') d.setDate(d.getDate() - unit);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns future date string YYYY-MM-DD after adding days.
 * @param {number} days 
 * @returns {string}
 */
const getFutureDateString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}


/* ====================
   BSOMS Component
 ==================== */

const BSOMS = () => {
    // --- States ---
    const [lang, setLang] = useState('kn'); // 'en' or 'kn'
    const [tab, setTab] = useState('dash');
    const [user, setUser] = useState(null); // 'owner', 'staff', 'customer', or null

    // Inventory & sales
    const [items, setItems] = useState([
        { id: 1, name: 'Bread', qty: 45, price: 40, shelf: 'A1', dateAdded: '2025-12-05T00:00:00.000Z', expiryDate: '2025-12-16' },
        { id: 2, name: 'Cake', qty: 8, price: 250, shelf: 'B2', dateAdded: '2025-12-03T00:00:00.000Z', expiryDate: '2025-12-15' },
        { id: 3, name: 'Cookies', qty: 15, price: 80, shelf: 'A2', dateAdded: '2025-10-08T00:00:00.000Z', expiryDate: '2025-11-02' },
        { id: 4, name: 'Muffin Mix', qty: 5, price: 120, shelf: 'C1', dateAdded: '2025-08-28T00:00:00.000Z', expiryDate: '2025-09-02' },
    ]);
    const [cart, setCart] = useState([]);
    const [bills, setBills] = useState([]);
    const [taxRate, setTaxRate] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Billing inputs
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemQty, setNewItemQty] = useState(1);
    const [billSearch, setBillSearch] = useState('');
    
    // Goods In inputs
    const [stockItemName, setStockItemName] = useState('');
    const [stockItemQty, setStockItemQty] = useState('');
    const [stockItemPrice, setStockItemPrice] = useState('');
    const [stockItemShelf, setStockItemShelf] = useState('');
    const [stockItemExpiryDate, setStockItemExpiryDate] = useState(getFutureDateString(7));

    // Workers & Leaves
    const [workersList, setWorkersList] = useState([
        { id: 101, name: 'Manjunath', role: 'Baker' },
        { id: 102, name: 'Suresh', role: 'Helper'}
    ]);
    const [leaves, setLeaves] = useState([
        { id: 1, workerId: 101, worker: 'Manjunath', type: 'Sick', startDate: '2025-11-23', endDate: '2025-11-24', status: 'Approved' },
        { id: 2, workerId: 102, worker: 'Suresh', type: 'Personal', startDate: '2025-12-20', endDate: '2025-12-21', status: 'Pending' }
    ]);
    const [newLeaveType, setNewLeaveType] = useState('');
    const [newLeaveNote, setNewLeaveNote] = useState('');
    const [newLeaveStartDate, setNewLeaveStartDate] = useState(getFutureDateString(1));
    const [newLeaveEndDate, setNewLeaveEndDate] = useState(getFutureDateString(1));
    const [leaveWorkerId, setLeaveWorkerId] = useState(101);

    // Worker Management Input Edit
    const [newWorkerName, setNewWorkerName] = useState('');
    const [newWorkerRole, setNewWorkerRole] = useState('');
    const [editingWorkerId, setEditingWorkerId] = useState(null);
    const [editingWorkerName, setEditingWorkerName] = useState('');
    const [editingWorkerRole, setEditingWorkerRole] = useState('');

    // Credits
    const [credits, setCredits] = useState([
        { id: 1, name: 'Ravi Kumar', amt: 450, issueDate: getFutureDateString(0), expiryDate: getFutureDateString(30), status: 'Not Paid' },
        { id: 2, name: 'Suma', amt: 120, issueDate: getFutureDateString(-40), expiryDate: getFutureDateString(-10), status: 'Not Paid' }
    ]);
    const [newCreditName, setNewCreditName] = useState('');
    const [newCreditAmount, setNewCreditAmount] = useState('');

    const [creditSearch, setCreditSearch] = useState('');
    const [creditFilter, setCreditFilter] = useState('All');
    const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);


    // Shelves
    const [shelves, setShelves] =   useState({
        A1: ['Bread', 'Buns', 'Rolls'],
        B2: ['Cake', 'Pastries'],
        C1: ['Muffin Mix', 'Flour']
    });
    const [newShelfId, setNewShelfId] = useState('');
    const [newShelfItems, setNewShelfItems] = useState('');
    const [editingShelfId, setEditingShelfId] = useState(null);
    const [editingNewId, setEditingNewId] = useState('');
    const [editingNewItems, setEditingNewItems] = useState('');
    // --- New States for Inventory Search & Filter ---
    const [searchQuery, setSearchQuery] = useState('');
    const [invFilter, setInvFilter] = useState('All');
    const [shelfSearch, setShelfSearch] = useState('');
    const [billSearchQuery, setBillSearchQuery] = useState('');
    const [stockSearchQuery, setStockSearchQuery] = useState('');
    const [wasteLog, setWasteLog] = useState([]);

    
    // Load from Supabase on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsRes, billsRes, workersRes, leavesRes, creditsRes, shelvesRes, wasteRes, settingsRes] = await Promise.all([
                    supabase.from('items').select('*').order('date_added', { ascending: false }),
                    supabase.from('bills').select('*').order('created_at', { ascending: false }),
                    supabase.from('workers').select('*'),
                    supabase.from('leaves').select('*'),
                    supabase.from('credits').select('*'),
                    supabase.from('shelves').select('*'),
                    supabase.from('waste_log').select('*'),
                    supabase.from('settings').select('*').single()
                ]);

                if (itemsRes.data) setItems(itemsRes.data.map(i => ({
                    ...i,
                    dateAdded: i.date_added,
                    expiryDate: i.expiry_date
                })));
                if (billsRes.data) setBills(billsRes.data.map(b => ({
                    ...b,
                    time: b.created_at
                })));
                if (workersRes.data) setWorkersList(workersRes.data);
                if (leavesRes.data) setLeaves(leavesRes.data.map(l => ({
                    ...l,
                    workerId: l.worker_id,
                    startDate: l.start_date,
                    endDate: l.end_date
                })));
                if (creditsRes.data) setCredits(creditsRes.data.map(c => ({
                    ...c,
                    issueDate: c.issue_date,
                    expiryDate: c.expiry_date
                })));
                if (shelvesRes.data) {
                    const shelvesMap = {};
                    shelvesRes.data.forEach(s => { shelvesMap[s.id] = s.items; });
                    setShelves(shelvesMap);
                }
                if (wasteRes.data) setWasteLog(wasteRes.data.map(w => ({
                    ...w,
                    expiryDate: w.original_expiry_date,
                    dateAdded: w.original_date_added,
                    wasteDate: w.waste_date
                })));
                if (settingsRes.data) {
                    setLang(settingsRes.data.lang);
                    setTaxRate(settingsRes.data.tax_rate);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
            setIsInitialLoadDone(true);
        };
        fetchData();
    }, []);


        /* ==============
       Computed Data & Analytics
       ============== */

    // Compute inventory with status
    const inventoryStatus = items.map(item => {
        const expiryDateObj = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDateObj.setHours(0, 0, 0, 0);

        const timeDiff = expiryDateObj.getTime() - today.getTime();
        const daysToExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        return {
            ...item,
            status: daysToExpiry < 0 ? 'Expired' : (daysToExpiry <= 2 ? 'Expiring' : 'Fresh'),
            daysToExpiry,
            isLowStock: item.qty < 10
        };
    });

    // This hides Expired items for the UI, sorted by qty > 0 first
    const liveInventoryOnly = inventoryStatus
        .filter(i => i.status !== 'Expired')
        .sort((a, b) => {
            if (a.qty > 0 && b.qty <= 0) return -1;
            if (a.qty <= 0 && b.qty > 0) return 1;
            return 0;
        });
    const liveItems = inventoryStatus.filter(item => item.status !== 'Expired').sort((a, b) => {
        if (a.qty > 0 && b.qty <= 0) return -1;
        if (a.qty <= 0 && b.qty > 0) return 1;
        return 0;
    });
    // Periodic waste analysis for time periods (new: 7 and 15 days also)
    const periodicWasteAnalysis = (() => {
    // Combine currently expired items + manually removed waste items
    const allWasteSources = [
        ...inventoryStatus.filter(i => i.status === 'Expired'),
        ...wasteLog
    ];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const periods = [
        { unit: 7, type: 'days', label: lang === 'en' ? 'Last 1 Week' : 'ಕಳೆದ ೭ ದಿನಗಳು', key: '1week' },
        { unit: 15, type: 'days', label: lang === 'en' ? 'Last 15 Days' : 'ಕಳೆದ ೧೫ ದಿನಗಳು', key: 'halfmonth' },
        { unit: 1, type: 'months', label: lang === 'en' ? 'Last 1 Month' : 'ಕಳೆದ ೧ ತಿಂಗಳು', key: '1month' },
        { unit: 3, type: 'months', label: lang === 'en' ? 'Last 3 Months' : 'ಕಳೆದ ೩ ತಿಂಗಳು', key: '3month' },
        { unit: 12, type: 'months', label: lang === 'en' ? 'Last 1 Year' : 'ಕಳೆದ ೧ ವರ್ಷ', key: '12month' },
    ];

    return periods.map(period => {
        const startDate = getDateAgo(period.unit, period.type);
        
        const filteredWaste = allWasteSources.filter(item => {
            // Use wasteDate if available, otherwise use expiryDate
            const dateToCompare = new Date(item.wasteDate || item.expiryDate);
            dateToCompare.setHours(0, 0, 0, 0);
            return dateToCompare >= startDate && dateToCompare <= today;
        });

        const totalLoss = filteredWaste.reduce((sum, item) => sum + (item.qty * item.price), 0);

        return {
            ...period,
            startDate: formatDate(startDate),
            totalLoss,
            itemsLost: filteredWaste.map(item => ({
                name: item.name,
                qty: item.qty,
                loss: item.qty * item.price,
                price: item.price,
                reason: item.lossReason || 'Expired',
                date: formatDate(new Date(item.wasteDate || item.expiryDate))
            }))
        };
    });
})();


    // Credit alerts: Not Paid credits expiring or overdue within 7 days
    const creditAlerts = credits.filter(credit => {
        if (credit.status === 'Paid') return false;
        const expiryDate = new Date(credit.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    });

    /* ==============
       Actions - logic & CRUD
       ============== */

    // Add stock
    const addStock = async () => {
    if (!stockItemName || !stockItemQty || !stockItemPrice || !stockItemShelf || !stockItemExpiryDate) {
        alert(t.fillAllStockDetails);
        return;
    }
    const qty = parseInt(stockItemQty);
    const price = parseFloat(stockItemPrice);
    const shelfIdUpper = stockItemShelf.toUpperCase().trim();
    const itemNameClean = stockItemName.trim();

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
        alert(t.validNumbersAlert);
        return;
    }

    const newId = Date.now();
    const newItem = {
        id: newId,
        name: itemNameClean,
        qty,
        price,
        shelf: shelfIdUpper,
        date_added: new Date().toISOString(),
        expiry_date: stockItemExpiryDate
    };

    const { error } = await supabase.from('items').insert([newItem]);
    if (!error) {
        setItems(prevItems => [{...newItem, dateAdded: newItem.date_added, expiryDate: newItem.expiry_date}, ...prevItems]);

        const { data: existingShelf } = await supabase.from('shelves').select('*').eq('id', shelfIdUpper).single();
        if (existingShelf) {
            if (!existingShelf.items.some(n => n.toLowerCase() === itemNameClean.toLowerCase())) {
                await supabase.from('shelves').update({ items: [...existingShelf.items, itemNameClean] }).eq('id', shelfIdUpper);
                setShelves(prev => ({...prev, [shelfIdUpper]: [...existingShelf.items, itemNameClean]}));
            }
        } else {
            await supabase.from('shelves').insert([{ id: shelfIdUpper, items: [itemNameClean] }]);
            setShelves(prev => ({...prev, [shelfIdUpper]: [itemNameClean]}));
        }
    }

    setStockItemName('');
    setStockItemQty('');
    setStockItemPrice('');
    setStockItemShelf('');
    setStockSearchQuery('');
    setStockItemExpiryDate(getFutureDateString(7));

    alert(`✅ ${itemNameClean} (Exp: ${stockItemExpiryDate}) ${t.stockAddedAlert}`);
};


    // Add to cart with availability checks
    const addToCart = () => {
        if (!newItemName || !newItemPrice || !newItemQty) {
            alert(t.enterItemDetails);
            return;
        }
        const price = parseFloat(newItemPrice);
        const qty = parseInt(newItemQty);
        const itemNameLower = newItemName.trim().toLowerCase();

        if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
            alert(t.validNumbersAlert);
            return;
        }

        const totalAvailableStock = inventoryStatus
            .filter(i => i.name.toLowerCase() === itemNameLower && i.status !== 'Expired')
            .reduce((sum, i) => sum + i.qty, 0);

        const qtyInCart = cart.find(item => item.name.toLowerCase() === itemNameLower)?.qty || 0;

        if (totalAvailableStock < qty + qtyInCart) {
            alert(t.insufficentStockAlert.replace('{count}', totalAvailableStock).replace('{name}', newItemName).replace('{cartQty}', qtyInCart));
            return;
        }

        const existing = cart.find(item => item.name.toLowerCase() === itemNameLower);
        if (existing) {
            setCart(cart.map(item =>
                item.name.toLowerCase() === itemNameLower ? { ...item, qty: item.qty + qty } : item
            ));
        } else {
            setCart([...cart, { name: newItemName.trim(), price, qty }]);
        }

        setNewItemName('');
        setNewItemPrice('');
        setNewItemQty(1);
    };

    // Generate bill and do FIFO stock deduction
    const generateBill = async (subtotal, tax, total) => {
        if (cart.length === 0) {
            alert(t.cartEmptyAlert);
            return;
        }
        let updatedItems = [...items];
        for (const soldItem of cart) {
            let remainingQty = soldItem.qty;
            updatedItems.sort((a,b) => new Date(a.dateAdded) - new Date(b.dateAdded));
            for (let i = 0; i < updatedItems.length && remainingQty > 0; i++) {
                const current = updatedItems[i];
                if (current.name.toLowerCase() === soldItem.name.toLowerCase() && !isExpired(current.expiryDate)) {
                    const availableQty = current.qty;
                    const deductQty = Math.min(availableQty, remainingQty);
                    current.qty -= deductQty;
                    remainingQty -= deductQty;
                }
            }
            if (remainingQty > 0) {
                console.error(`FIFO error: Could not deduct ${remainingQty} units of ${soldItem.name}.`);
            }
        }

        for (const item of updatedItems) {
            if (item.qty <= 0) {
                await supabase.from('items').delete().eq('id', item.id);
            } else {
                await supabase.from('items').update({ qty: item.qty }).eq('id', item.id);
            }
        }

        const filteredItems = updatedItems.filter(i => i.qty > 0);
        setItems(filteredItems);

        const billRecord = {
            id: Date.now(),
            items: cart,
            subtotal,
            tax,
            total,
            created_at: new Date().toISOString()
        };
        await supabase.from('bills').insert([billRecord]);
        setBills(prev => [{...billRecord, time: billRecord.created_at}, ...prev]);
        alert(t.billGeneratedAlert.replace('{total}', total.toFixed(2)));
        setCart([]);
    };

    // Add credit with automatic dates
    const addCreditRecord = async () => {
        if (!newCreditName || !newCreditAmount || parseFloat(newCreditAmount) <= 0) {
            alert(t.creditValidationAlert);
            return;
        }
        const amount = parseFloat(newCreditAmount);
        const issueDate = getFutureDateString(0);
        const expiryDate = getFutureDateString(30);
        const newCredit = {
            id: Date.now(),
            name: newCreditName.trim(),
            amt: amount,
            issue_date: issueDate,
            expiry_date: expiryDate,
            status: 'Not Paid'
        };
        const { error } = await supabase.from('credits').insert([newCredit]);
        if (!error) {
            setCredits(prev => [{...newCredit, issueDate, expiryDate}, ...prev]);
        }
        setNewCreditName('');
        setNewCreditAmount('');
        alert(t.creditAddedAlert.replace('{amount}', amount).replace('{name}', newCredit.name).replace('{date}', formatDate(expiryDate)));
    };

    // Update credit status e.g. Paid <-> Not Paid
    const updateCreditStatus = async (creditId, newStatus) => {
        await supabase.from('credits').update({ status: newStatus }).eq('id', creditId);
        setCredits(prev => prev.map(c => c.id === creditId ? { ...c, status: newStatus } : c));
        alert(t.creditUpdatedAlert.replace('{id}', creditId).replace('{status}', t[newStatus.toLowerCase().replace(/\s/g, '')] || newStatus));
    };

    // Apply leave request by staff
    const applyLeaveRequest = async () => {
        const worker = workersList.find(w => w.id === leaveWorkerId);
        if(!worker || !newLeaveType || !newLeaveStartDate || !newLeaveEndDate) {
            alert(t.leaveValidationAlert);
            return;
        }
        if(new Date(newLeaveStartDate) > new Date(newLeaveEndDate)) {
            alert(lang === 'en' ? 'Start date cannot be after end date!' : 'ಪ್ರಾರಂಭದ ದಿನಾಂಕವು ಅಂತಿಮ ದಿನಾಂಕಕ್ಕಿಂತ ನಂತರ ಇರಬಾರದು!');
            return;
        }
        const newRequest = {
            id: Date.now(),
            worker_id: leaveWorkerId,
            worker: worker.name,
            type: newLeaveType.trim(),
            note: newLeaveNote ? newLeaveNote.trim() : '',
            start_date: newLeaveStartDate,
            end_date: newLeaveEndDate,
            status: 'Pending'
        };
        const { error } = await supabase.from('leaves').insert([newRequest]);
        if (!error) {
            setLeaves(prev => [{...newRequest, workerId: newRequest.worker_id, startDate: newRequest.start_date, endDate: newRequest.end_date}, ...prev]);
        }
        setNewLeaveType('');
        setNewLeaveNote('');
        setNewLeaveStartDate(getFutureDateString(1));
        setNewLeaveEndDate(getFutureDateString(1));
        alert(t.leaveSubmittedAlert.replace('{name}', worker.name));
    };

    // Owner action on leaves: approve or reject
    const handleLeaveAction = async (leaveId, action) => {
        const status = action === 'approve' ? 'Approved' : 'Rejected';
        await supabase.from('leaves').update({ status }).eq('id', leaveId);
        setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l));
        alert(t.leaveActionAlert.replace('{action}', action === 'approve' ? (lang==='en'?'Approved':'ಅನುಮೋದಿಸಲಾಗಿದೆ') : (lang==='en'?'Rejected':'ನಿರಾಕರಿಸಲಾಗಿದೆ')));
    };

    // Shelf management - add shelf
    const addShelfRecord = async () => {
        if (!newShelfId || !newShelfItems) {
            alert(t.shelfValidationAlert);
            return;
        }
        const shelfIdUpper = newShelfId.toUpperCase().trim();
        if (shelves[shelfIdUpper]) {
            alert(t.shelfExistsAlert.replace('{id}', shelfIdUpper));
            return;
        }
        const itemsArray = newShelfItems.split(',').map(i => i.trim()).filter(i => i.length);
        const { error } = await supabase.from('shelves').insert([{ id: shelfIdUpper, items: itemsArray }]);
        if (!error) {
            setShelves(prev => ({ ...prev, [shelfIdUpper]: itemsArray }));
        }
        setNewShelfId('');
        setNewShelfItems('');
        alert(t.shelfAddedAlert.replace('{id}', shelfIdUpper).replace('{count}', itemsArray.length));
    };

    // Editing shelf - initialize editing
    const startEditShelf = (id, items) => {
        setEditingShelfId(id);
        setEditingNewId(id);
        setEditingNewItems(items.join(', '));
    };

    // Save shelf edits
    const saveEditShelf = async () => {
        if (!editingNewId || !editingNewItems) {
            alert(t.shelfValidationAlert);
            return;
        }
        const newIdUpper = editingNewId.toUpperCase().trim();
        const itemsArray = editingNewItems.split(',').map(i => i.trim()).filter(i => i.length);

        if (editingShelfId !== newIdUpper) {
            const { data: existing } = await supabase.from('shelves').select('*').eq('id', newIdUpper).single();
            if (existing) {
                alert(t.shelfExistsAlert.replace('{id}', newIdUpper));
                return;
            }
            await supabase.from('shelves').delete().eq('id', editingShelfId);
            await supabase.from('shelves').insert([{ id: newIdUpper, items: itemsArray }]);
        } else {
            await supabase.from('shelves').update({ items: itemsArray }).eq('id', newIdUpper);
        }

        setShelves(prev => {
            const newShelves = {};
            Object.keys(prev).forEach(k => { if (k !== editingShelfId) newShelves[k] = prev[k]; });
            newShelves[newIdUpper] = itemsArray;
            return newShelves;
        });

        alert(t.shelfUpdatedAlert.replace('{id}', newIdUpper));
        setEditingShelfId(null);
        setEditingNewId('');
        setEditingNewItems('');
    };

    // Add new worker
    const addWorker = async () => {
        if(!newWorkerName || !newWorkerRole) {
            alert(t.workerValidationAlert);
            return;
        }
        const newWorker = { id: Date.now(), name: newWorkerName.trim(), role: newWorkerRole.trim() };
        const { error } = await supabase.from('workers').insert([newWorker]);
        if (!error) {
            setWorkersList(prev => [...prev, newWorker]);
        }
        setNewWorkerName('');
        setNewWorkerRole('');
        alert(t.workerAddedAlert.replace('{name}', newWorker.name));
    };

    // Start editing worker info
    const startEditWorker = (worker) => {
        setEditingWorkerId(worker.id);
        setEditingWorkerName(worker.name);
        setEditingWorkerRole(worker.role);
    };

    // Save edited worker info
    const saveEditWorker = async () => {
        if(!editingWorkerName || !editingWorkerRole) {
            alert(t.workerValidationAlert);
            return;
        }
        await supabase.from('workers').update({ name: editingWorkerName.trim(), role: editingWorkerRole.trim() }).eq('id', editingWorkerId);
        await supabase.from('leaves').update({ worker: editingWorkerName.trim() }).eq('worker_id', editingWorkerId);
        setWorkersList(prev => prev.map(w => w.id === editingWorkerId ? { ...w, name: editingWorkerName.trim(), role: editingWorkerRole.trim() } : w));
        setLeaves(prev => prev.map(l => l.workerId === editingWorkerId ? { ...l, worker: editingWorkerName.trim() } : l));
        alert(t.workerUpdatedAlert.replace('{name}', editingWorkerName));
        setEditingWorkerId(null);
        setEditingWorkerName('');
        setEditingWorkerRole('');
    };

    const markAsWaste = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const confirmMsg = lang === 'en'
        ? `Mark ${item.name} as waste/spoiled?`
        : `${item.name} ಹಾಳಾಗಿದೆ ಎಂದು ಗುರುತಿಸಬೇಕೆ?`;

    if (window.confirm(confirmMsg)) {
        const wasteId = `waste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const wasteEntry = {
            id: wasteId,
            original_item_id: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
            shelf: item.shelf,
            original_date_added: item.dateAdded,
            original_expiry_date: item.expiryDate,
            waste_date: new Date().toISOString(),
            loss_reason: 'Manual/Spoilage'
        };

        await supabase.from('waste_log').insert([wasteEntry]);
        await supabase.from('items').delete().eq('id', itemId);
        setWasteLog(prev => [{...wasteEntry, wasteDate: wasteEntry.waste_date, expiryDate: wasteEntry.original_expiry_date, dateAdded: wasteEntry.original_date_added}, ...prev]);
        setItems(prev => prev.filter(i => i.id !== itemId));
        alert(lang === 'en' ? 'Item recorded as waste.' : 'ವಸ್ತುವನ್ನು ತ್ಯಾಜ್ಯವೆಂದು ದಾಖಲಿಸಲಾಗಿದೆ.');
    }
};


    /* ====================
       Translations & Styles
     ==================== */

    const t = lang === 'en' ? {
        title: 'BSOMS', welcome: 'Welcome to', fullName: 'Bakery Smart Operations Management System',
        owner: 'Owner', staff: 'Staff', customer: 'Customer', selectRole: 'Select Your Role',
        dash: 'Dashboard', inv: 'Inventory', bill: 'Billing', billHist: 'Bills History', credit: 'Credit',
        workers: 'Workers', shelf: 'Shelf', analytics: 'Analytics', logout: 'Logout', viewMenu: 'View Menu',
        items: 'Items Total', lowStock: 'Low Stock', expiring: 'Expiring Soon', sales: 'Sales Today',
        apply: 'Apply Leave', approve: 'Approve', reject: 'Reject', addCredit: 'Add Credit',
        markPaid: 'Mark Paid', markNotPaid: 'Mark Not Paid', markExpired: 'Mark Expired',
        notPaid: 'Not Paid', paid: 'Paid', expired: 'Expired',
        Expired: 'Expired',
        Expiring: 'Expiring',
        Fresh: 'Fresh',
        customerName: 'Customer Name', amount: 'Amount', dueDate: 'Expiry Date', issueDate: 'Issue Date', status: 'Status',
        waste: "Today's Waste", mostWasted: 'Most Wasted', tax: 'Tax',
        goodsIn: 'Goods In/Baking', expiryDate: 'Expiry Date', price: 'Price', shelfID: 'Shelf ID', addStockBtn: '➕ Add Stock Unit',
        monthlyWaste: 'Periodic Waste Analysis', totalLoss: 'Total Loss', itemsLost: 'Items Expired',
        leaveType: 'Leave Type', workerName: 'Worker Name', details: 'Details',
        approved: 'Approved', pending: 'Pending',
        shelfItems: 'Items (comma-separated)', shelfLocation: 'Shelf Location', editShelf: 'Edit Shelf', addShelf: 'Add New Shelf',
        qty: 'Qty', leave: 'Leave', startDate: 'Start Date', endDate: 'End Date', creditDue: 'Credit Due Alert',
        itemNamePlaceholder: 'Item Name (e.g., Croissant)',
        clearBtn: 'Clear',
        generateBillBtn: '💳 Generate Bill',
        inventoryShelf: 'Shelf',
        inventoryAdded: 'Added',
        inventoryExpires: 'Expires',
        saveChanges: '✔️ Save Changes',
        cancel: 'Cancel',
        edit: 'Edit',
        noMenu: 'Sorry, the menu is currently empty. We are out of fresh stock.',
        issueNewCredit: '💳 Issue New Credit',
        freshnessAlerts: '⚠️ Freshness & Financial Alerts',
        alertExpiresOn: 'expires on',
        alertItemsExpiredToday: 'Items Expired/Spoiled Today',
        alertFindAt: 'Find at',
        alertExpiresInDays: 'Expires in **{days} days**!',
        wasteReviewDesc: 'Review the value of products lost due to expiry over different time periods.',
        noWaste: 'No waste recorded in this period.',
        addWorker: 'Add Worker',
        editWorker: 'Edit Worker',
        addWorkerBtn: '➕ Add New Worker',
        workerNamePlaceholder: 'Worker Name',
        workerRolePlaceholder: 'Role (e.g., Cashier)',
        role: 'Role',
        placeholderItemName: 'Item Name (e.g., Croissant)',
        placeholderPrice: 'Price',
        placeholderQty: 'Qty',
        placeholderShelfID: 'Shelf ID',
        placeholderCreditName: 'Customer Name',
        placeholderCreditAmount: 'Amount',
        placeholderLeaveType: 'Leave Type',
        placeholderShelfItems: 'Items (comma-separated)',
        fillAllStockDetails: "Please fill all stock details: Name, Qty, Price, Shelf ID, and Expiry Date.",
        validNumbersAlert: "Quantity and Price must be valid positive numbers.",
        insufficentStockAlert: "Insufficient fresh stock. Only {count} available for {name}. {cartQty} already in cart.",
        stockAddedAlert: 'stock added!',
        enterItemDetails: "Please enter item name, price, and quantity.",
        cartEmptyAlert: "Cart is empty. Please add items to bill.",
        billGeneratedAlert: "Bill Generated! Total: ₹{total}",
        creditValidationAlert: "Please enter a valid customer name and amount.",
        creditAddedAlert: "Credit of ₹{amount} added for {name}. Expires on {date}.",
        creditUpdatedAlert: "Credit ID {id} marked as **{status}**.",
        leaveValidationAlert: "Please select a worker, leave type, and valid start/end dates.",
        dateValidationAlert: "Start date cannot be after the end date.",
        leaveSubmittedAlert: "Leave request submitted for {name}. Status: Pending.",
        leaveActionAlert: "Leave request {action}!",
        shelfValidationAlert: "Shelf ID and items cannot be empty.",
        shelfExistsAlert: "Shelf ID {id} already exists!",
        shelfAddedAlert: "Shelf {id} added with {count} items.",
        shelfUpdatedAlert: "Shelf {id} successfully updated.",
        workerValidationAlert: "Please enter both worker name and role.",
        workerAddedAlert: "{name} worker has been added.",
        workerUpdatedAlert: "{name}'s details have been updated.",
        actionLeaves: "Action Required: Leaves",
        newBadge: "NEW",
        overdue: "🔴 OVERDUE",
        upcoming: "⏳ UPCOMING",
        liveInventory: "Live Inventory Monitor",
        removeWaste: "Remove as Waste",
        invDesc: "Inventory is tracked by specific stock units. **FIFO (First-In, First-Out) is used in billing.**",
        goodsInDesc: "Enter newly baked/delivered goods to update inventory and set expiry dates.",
        creditDesc: "Credit expires automatically after **30 days**.",
        wasteReviewDesc: "Review the value of products lost due to expiry over different time periods."  ,
        applyLeave: 'Apply for Leave',
        selectWorker: '-- Select Worker --',
        leaveType: '-- Type --',
        sickLeave: 'Sick Leave',
        personalLeave: 'Personal Leave',
        casualLeave: 'Casual Leave',
        leaveReason: 'Reason for leave...',
        submit: 'Submit',
        'Low Stock': 'Low Stock',
        'All': 'All',
    } : {
        title: 'ಬಿಎಸ್‌ಒಎಂಎಸ್', welcome: 'ಸ್ವಾಗತ', fullName: 'ಬೇಕರಿ ಸ್ಮಾರ್ಟ್ ಆಪರೇಷನ್ಸ್ ಮ್ಯಾನೇಜ್ಮೆಂಟ್ ಸಿಸ್ಟಂಮ',
        owner: 'ಮಾಲೀಕ', staff: 'ಸಿಬ್ಬಂದಿ', customer: 'ಗ್ರಾಹಕ', selectRole: 'ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ',
        dash: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', inv: 'ದಾಸ್ತಾನು', bill: 'ಬಿಲ್ಲಿಂಗ್', billHist: 'ಬಿಲ್ ಇತಿಹಾಸ', credit: 'ಸಾಲ',
        workers: 'ಕೆಲಸಗಾರರು', shelf: 'ಶೆಲ್ಫ್', analytics: 'ವಿಶ್ಲೇಷಣೆ', logout: 'ಲಾಗ್‌ಔಟ್', viewMenu: 'ಮೆನು ವೀಕ್ಷಿಸಿ',
        items: 'ಒಟ್ಟು ವಸ್ತುಗಳು', lowStock: 'ಕಡಿಮೆ ಸ್ಟಾಕ್', expiring: 'ಶೀಘ್ರದಲ್ಲೇ ಅವಧಿ', sales: 'ಇಂದಿನ ಮಾರಾಟ',
        apply: 'ರಜೆ ಹಾಕಿ', approve: 'ಅನುಮೋದಿಸು', reject: 'ನಿರಾಕರಿಸು', addCredit: 'ಸಾಲ ಸೇರಿಸಿ',
        markPaid: 'ಪಾವತಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ', markNotPaid: 'ಪಾವತಿಸಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿ', markExpired: 'ಅವಧಿ ಮೀರಿದೆ ಎಂದು ಗುರುತಿಸಿ',
        notPaid: 'ಪಾವತಿಸಿಲ್ಲ',
        paid: 'ಪಾವತಿಸಲಾಗಿದೆ',
        expired: 'ಅವಧಿ ಮೀರಿದೆ',
        Expired: 'ಅವಧಿ ಮೀರಿದೆ',
        exp: 'ಅವಧಿ ಮೀರಿದೆ',
        Expiring: 'ಅವಧಿ ಮುಗಿಯುತ್ತಿದೆ',
        Fresh: 'ತಾಜಾ',
        customerName: 'ಗ್ರಾಹಕರ ಹೆಸರು', amount: 'ಮೊತ್ತ', dueDate: 'ಅವಧಿ ದಿನಾಂಕ', issueDate: 'ನೀಡಿದ ದಿನಾಂಕ', status: 'ಸ್ಥಿತಿ',
        waste: 'ಇಂದಿನ ತ್ಯಾಜ್ಯ', mostWasted: 'ಅತಿ ತ್ಯಾಜ್ಯ', tax: 'ತೆರಿಗೆ',
        goodsIn: 'ಸಾಮಾನು ಒಳಗೆ/ಬೇಕಿಂಗ್', expiryDate: 'ಅವಧಿ ದಿನಾಂಕ', price: 'ಬೆಲೆ', shelfID: 'ಶೆಲ್ಫ್ ಐಡಿ', addStockBtn: '➕ ಸ್ಟಾಕ್ ಘಟಕ ಸೇರಿಸಿ',
        monthlyWaste: 'ಆವರ್ತಕ ತ್ಯಾಜ್ಯ ವಿಶ್ಲೇಷಣೆ', totalLoss: 'ಒಟ್ಟು ನಷ್ಟ', itemsLost: 'ಅವಧಿ ಮುಗಿದ ವಸ್ತುಗಳು',
        leaveType: 'ರಜೆಯ ಪ್ರಕಾರ', workerName: 'ಕೆಲಸಗಾರರ ಹೆಸರು', details: 'ವಿವರಗಳು',
        approved: 'ಅನುಮೋದಿತ', pending: 'ಬಾಕಿ ಇದೆ',
        shelfItems: 'ವಸ್ತುಗಳು (ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಲಾಗಿದೆ)', shelfLocation: 'ಶೆಲ್ಫ್ ಸ್ಥಳ', editShelf: 'ಶೆಲ್ಫ್ ಸಂಪಾದಿಸಿ', addShelf: 'ಹೊಸ ಶೆಲ್ಫ್ ಸೇರಿಸಿ',
        qty: 'ಪ್ರಮಾಣ', leave: 'ರಜೆ', startDate: 'ಪ್ರಾರಂಭ ದಿನಾಂಕ', endDate: 'ಅಂತ್ಯ ದಿನಾಂಕ', creditDue: 'ಸಾಲದ ಎಚ್ಚರಿಕೆ',
        itemNamePlaceholder: 'ವಸ್ತುವಿನ ಹೆಸರು',
        clearBtn: 'ತೆಗೆದುಹಾಕು',
        generateBillBtn: '💳 ಬಿಲ್ ರಚಿಸಿ',
        inventoryShelf: 'ಶೆಲ್ಫ್',
        inventoryAdded: 'ಸೇರಿಸಲಾಗಿದೆ',
        inventoryExpires: 'ಅವಧಿ',
        saveChanges: '✔️ ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
        cancel: 'ರದ್ದುಮಾಡು',
        edit: 'ಸಂಪಾದಿಸಿ',
        noMenu: 'ಕ್ಷಮಿಸಿ, ಮೆನು ಸದ್ಯಕ್ಕೆ ಖಾಲಿಯಾಗಿದೆ. ನಮ್ಮಲ್ಲಿ ತಾಜಾ ಸ್ಟಾಕ್ ಇಲ್ಲ.',
        issueNewCredit: '💳 ಹೊಸ ಸಾಲ ನೀಡಿ',
        freshnessAlerts: '⚠️ ತಾಜಾತನ ಮತ್ತು ಆರ್ಥಿಕ ಎಚ್ಚರಿಕೆಗಳು',
        alertExpiresOn: 'ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ',
        alertItemsExpiredToday: 'ಇಂದು ಅವಧಿ ಮೀರಿದ/ಹಾಳಾದ ವಸ್ತುಗಳು',
        alertFindAt: 'ಇಲ್ಲಿ ಲಭ್ಯವಿದೆ',
        alertExpiresInDays: '**{days} ದಿನಗಳಲ್ಲಿ** ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ!',
        wasteReviewDesc: 'ವಿವಿಧ ಸಮಯಾವಧಿಗಳಲ್ಲಿ ಅವಧಿ ಮುಗಿದ ಕಾರಣ ಕಳೆದುಹೋದ ಉತ್ಪನ್ನಗಳ ಮೌಲ್ಯವನ್ನು ಪರಿಶೀಲಿಸಿ.',
        noWaste: 'ಈ ಅವಧಿಯಲ್ಲಿ ಯಾವುದೇ ತ್ಯಾಜ್ಯ ದಾಖಲಾಗಿಲ್ಲ.',
        addWorker: 'ಕೆಲಸಗಾರ ಸೇರಿಸಿ',
        editWorker: 'ಕೆಲಸಗಾರ ಸಂಪಾದಿಸಿ',
        addWorkerBtn: '➕ ಹೊಸ ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಿ',
        workerNamePlaceholder: 'ಕೆಲಸಗಾರರ ಹೆಸರು',
        workerRolePlaceholder: 'ಪಾತ್ರ (ಉದಾ: ಕ್ಯಾಷಿಯರ್)',
        role: 'ಪಾತ್ರ',
        placeholderItemName: 'ವಸ್ತುವಿನ ಹೆಸರು',
        placeholderPrice: 'ಬೆಲೆ',
        placeholderQty: 'ಪ್ರಮಾಣ',
        placeholderShelfID: 'ಶೆಲ್ಫ್ ಐಡಿ',
        placeholderCreditName: 'ಗ್ರಾಹಕರ ಹೆಸರು',
        placeholderCreditAmount: 'ಮೊತ್ತ',
        placeholderLeaveType: 'ರಜೆಯ ಪ್ರಕಾರ',
        placeholderShelfItems: 'ವಸ್ತುಗಳು (ಅಲ್ಪವಿರಾಮದಿಂದ)',
        fillAllStockDetails: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಸ್ಟಾಕ್ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ: ಹೆಸರು, ಪ್ರಮಾಣ, ಬೆಲೆ, ಶೆಲ್ಫ್ ಐಡಿ ಮತ್ತು ಅವಧಿ ದಿನಾಂಕ.",
        validNumbersAlert: "ಪ್ರಮಾಣ ಮತ್ತು ಬೆಲೆಗಳು ಸರಿಯಾದ ಧನಾತ್ಮಕ ಸಂಖ್ಯೆಗಳಾಗಿರಬೇಕು.",
        insufficentStockAlert: "ಸಾಕಷ್ಟು ತಾಜಾ ಸ್ಟಾಕ್ ಇಲ್ಲ. {name} ಗೆ ಕೇವಲ {count} ಲಭ್ಯವಿದೆ. ಕಾರ್ಟ್‌ನಲ್ಲಿ ಈಗಾಗಲೇ {cartQty} ಇದೆ.",
        stockAddedAlert: 'ಸ್ಟಾಕ್ ಸೇರಿಸಲಾಗಿದೆ!',
        enterItemDetails: "ದಯವಿಟ್ಟು ವಸ್ತುವಿನ ಹೆಸರು, ಬೆಲೆ ಮತ್ತು ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ.",
        cartEmptyAlert: "ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ. ಬಿಲ್ ಮಾಡಲು ವಸ್ತುಗಳನ್ನು ಸೇರಿಸಿ.",
        billGeneratedAlert: "ಬಿಲ್ ರಚಿಸಲಾಗಿದೆ! ಒಟ್ಟು: ₹{total}",
        creditValidationAlert: "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಗ್ರಾಹಕರ ಹೆಸರು ಮತ್ತು ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ.",
        creditAddedAlert: "{name} ಗೆ ₹{amount} ಸಾಲವನ್ನು ಸೇರಿಸಲಾಗಿದೆ. {date} ರಲ್ಲಿ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ.",
        creditUpdatedAlert: "ಸಾಲ ಐಡಿ {id} ಅನ್ನು **{status}** ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
        leaveValidationAlert: "ದಯವಿಟ್ಟು ಕೆಲಸಗಾರ, ರಜೆ ಪ್ರಕಾರ ಮತ್ತು ಸರಿಯಾದ ಪ್ರಾರಂಭ/ಅಂತ್ಯ ದಿನಾಂಕಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
        dateValidationAlert: "ಪ್ರಾರಂಭ ದಿನಾಂಕವು ಅಂತ್ಯ ದಿನಾಂಕದ ನಂತರ ಇರಬಾರದು.",
        leaveSubmittedAlert: "ರಜೆ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ. ಸ್ಥಿತಿ: ಬಾಕಿ ಇದೆ.",
        leaveActionAlert: "ರಜೆ ವಿನಂತಿಯನ್ನು {action}!",
        shelfValidationAlert: "ಶೆಲ್ಫ್ ಐಡಿ ಮತ್ತು ವಸ್ತುಗಳು ಖಾಲಿಯಾಗಿರಬಾರದು.",
        shelfExistsAlert: "ಶೆಲ್ಫ್ ಐಡಿ {id} ಈಗಾಗಲೇ ಅಸ್ತಿತ್ವದಲ್ಲಿದೆ!",
        shelfAddedAlert: "ಶೆಲ್ಫ್ {id} ಅನ್ನು {count} ವಸ್ತುಗಳೊಂದಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.",
        shelfUpdatedAlert: "ಶೆಲ್ಫ್ {id} ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.",
        workerValidationAlert: "ದಯವಿಟ್ಟು ಕೆಲಸಗಾರರ ಹೆಸರು ಮತ್ತು ಪಾತ್ರ ಎರಡನ್ನೂ ನಮೂದಿಸಿ.",
        workerAddedAlert: "{name} ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಲಾಗಿದೆ.",
        workerUpdatedAlert: "{name} ಕೆಲಸಗಾರರ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.",
        actionLeaves: "ಕ್ರಮ ಅಗತ್ಯವಿದೆ: ರಜೆಗಳು",
        newBadge: "ಹೊಸದು",
        overdue: "🔴 ಬಾಕಿ ಉಳಿದಿದೆ",
        upcoming: "⏳ ಬರಲಿದೆ",
        liveInventory: "ದಾಸ್ತಾನು ಸ್ಥಿತಿ",
        removeWaste: "ತ್ಯಾಜ್ಯ ಎಂದು ಗುರುತಿಸಿ ",
        invDesc: "ದಾಸ್ತಾನು ನಿರ್ದಿಷ್ಟ ಸ್ಟಾಕ್ ಘಟಕಗಳಿಂದ ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುತ್ತದೆ. **ಬಿಲ್ಲಿಂಗ್‌ನಲ್ಲಿ FIFO (ಮೊದಲು ಬಂದದ್ದು ಮೊದಲು ಹೋಗುವುದು) ಬಳಸಲಾಗುತ್ತದೆ.**",
        goodsInDesc: "ಹೊಸದಾಗಿ ತಯಾರಿಸಿದ/ವಿತರಿಸಿದ ವಸ್ತುಗಳನ್ನು ದಾಸ್ತಾನು ನವೀಕರಿಸಲು ಮತ್ತು ಅವಧಿ ದಿನಾಂಕಗಳನ್ನು ಹೊಂದಿಸಲು ನಮೂದಿಸಿ.",
        creditDesc: "ಸಾಲವು **೩೦ ದಿನಗಳ** ನಂತರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ.",
        wasteReviewDesc: "ವಿವಿಧ ಸಮಯಾವಧಿಗಳಲ್ಲಿ ಅವಧಿ ಮುಗಿದ ಕಾರಣ ಕಳೆದುಹೋದ ಉತ್ಪನ್ನಗಳ ಮೌಲ್ಯವನ್ನು ಪರಿಶೀಲಿಸಿ.",
        applyLeave: 'ರಜೆಗಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
        selectWorker: '-- ಕಾರ್ಮಿಕರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ --',
        leaveType: '-- ರಜೆ ವಿಧ --',
        sickLeave: 'ಅನಾರೋಗ್ಯ ರಜೆ',
        personalLeave: 'ವೈಯಕ್ತಿಕ ರಜೆ',
        casualLeave: 'ಸಾಮಾನ್ಯ ರಜೆ',
        leaveReason: 'ರಜೆಯ ಕಾರಣ...',
        submit: 'ಸಲ್ಲಿಸಿ',
        sanctioned: 'ಮಂಜೂರಾಗಿದೆ',
        approved: 'ಅನುಮೋದಿಸಲಾಗಿದೆ',
        rejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
        pending: 'ಬಾಕಿ ಇದೆ',
        history: 'ಇತಿಹಾಸ',
        status: 'ಸ್ಥಿತಿ',
        'Low Stock': 'ಕಡಿಮೆ ಸ್ಟಾಕ್',
        'All': 'ಎಲ್ಲಾ',
    };

    const s = {
        card: { 
            background: '#fff', 
            borderRadius: '20px', 
            padding: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #f1f5f9'
        },
        btn: { 
            padding: '12px 24px', 
            borderRadius: '12px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        headerGrad: {
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            color: '#fff',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '20px'
        },
        input: { 
            width: '100%', 
            padding: '12px 16px', 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            fontSize: '14px', 
            marginBottom: '16px',
            outlineColor: '#2563eb'
        },
        tableHeader: {
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            paddingBottom: '12px',
            borderBottom: '2px solid #f1f5f9',
            marginBottom: '10px'
        },
        badge: (bg, color) => ({
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: bg,
            color: color
        })
    };


    // Reusable small stat display box
    const StatBox = ({ label, value, color }) => (
        <div style={{ background: color, color: '#fff', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>{label}</p>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0' }}>{value}</h3>
        </div>
    );

    /* ====================
       UI Rendering
     ==================== */

    // Role selection screen
    if (!user) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '48px 36px', maxWidth: '420px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
                    <button onClick={() => setLang(lang === 'en' ? 'kn' : 'en')} style={{ ...s.btn, float: 'right', background: '#f3f4f6', color: '#374151', fontSize: '13px', padding: '8px 16px' }}>
                        🌐 {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
                    </button>
                    <div style={{ textAlign: 'center', marginBottom: '36px', clear: 'both' }}>
                        <div style={{ fontSize: '56px', marginBottom: '20px' }}>🥖</div>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.welcome}</p>
                        <h1 style={{ fontSize: '19px', margin: '0 0 4px 0', fontWeight: '700', color: '#111827', lineHeight: '1.3' }}>{t.fullName}</h1>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '8px 0 0 0' }}>{t.title}</h2>
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#6b7280', marginBottom: '20px', textAlign: 'center' }}>{t.selectRole}</p>
                    {[
                        { role: 'owner', icon: '👔', grad: 'linear-gradient(135deg, #667eea, #764ba2)' },
                        { role: 'staff', icon: '👨‍🍳', grad: 'linear-gradient(135deg, #f093fb, #f5576c)' },
                        { role: 'customer', icon: '🛒', grad: 'linear-gradient(135deg, #4facfe, #00f2fe)' }
                    ].map(r => (
                        <button key={r.role} onClick={() => setUser(r.role)}
                            style={{ width: '100%', background: r.grad, color: '#fff', padding: '18px 24px', borderRadius: '14px', border: 'none', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', fontSize: '17px', fontWeight: '600', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
                            <span style={{ fontSize: '26px', marginRight: '16px' }}>{r.icon}</span>
                            {t[r.role]}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Customer view (Menu)
    if (user === 'customer') {
        // 1. Logic: Filter by Status, Qty, and Search Term
        const freshInventory = inventoryStatus.filter(i =>
            i.status !== 'Expired' &&
            i.qty > 0 &&
            i.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    
        // 2. Logic: Grouping quantities for a consolidated view
        const menuItems = freshInventory.reduce((acc, item) => {
            const existing = acc.find(a => a.name === item.name);
            if (existing) {
                existing.qty += item.qty;
            } else {
                acc.push({ name: item.name, price: item.price, qty: item.qty, shelf: item.shelf });
            }
            return acc;
        }, []);
    
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
                
                {/* Top Row: Clean Emoji Toggle & Logout  */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <button 
                        onClick={() => setLang(lang === 'en' ? 'kn' : 'en')} 
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '5px' }}
                    >
                        🌐
                    </button>
    
                    <button 
                        onClick={() => { setUser(null); setSearchTerm(''); }} 
                        style={{ ...s.btn, background: '#dc2626', color: '#fff', fontSize: '12px', padding: '8px 14px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}
                    >
                        {t.logout}
                    </button>
                </div>
    
                {/* Header Section */}
                <div style={{ background: 'linear-gradient(to right, #4facfe, #00f2fe)', color: '#fff', padding: '25px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>🛒 {t.viewMenu} - {t.title}</h1>
                    
                    {/* Natural & Friendly Translated Welcome Text */}
                    <p style={{ margin: '8px 0 0 0', fontSize: '15px', opacity: 0.9, fontWeight: '500' }}>
                        {lang === 'en' 
                            ? "Welcome! Check what's in stock and where to find it." 
                            : "ಸ್ವಾಗತ! ನಮ್ಮಲ್ಲಿ ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳು ಮತ್ತು ಅವು ಇರುವ ಜಾಗವನ್ನು ಇಲ್ಲಿ ನೋಡಿ."}
                    </p>
    
                    {/* Search Bar: Positioned below welcome message */}
                    <div style={{ marginTop: '20px' }}>
                        <input
                            type="text"
                            placeholder={lang === 'en' ? "Search products..." : "ಹುಡುಕಿ..."}
                            style={{ 
                                ...s.input, 
                                width: '100%', 
                                maxWidth: '450px', 
                                padding: '12px 15px', 
                                borderRadius: '10px', 
                                border: 'none', 
                                color: '#333',
                                fontSize: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
    
                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {menuItems.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px' }}>
                            <p style={{ color: '#6b7280', fontSize: '16px' }}>{t.noMenu}</p>
                        </div>
                    ) : (
                        menuItems.map(item => (
                            <div key={item.name} style={{ ...s.card, padding: '15px', borderLeft: '5px solid #4facfe', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{item.name}</h3>
    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>
                                            ₹{Number(item.price).toFixed(2)}
                                        </span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#059669', display: 'block' }}>
                                                ✅ {t.qty}: {item.qty}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                                📍 {t.alertFindAt}: <strong>{item.shelf || 'N/A'}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
    
                                {/* Urgency Badge with 5/15 Stock Thresholds */}
                                <div style={{
                                    fontSize: '11px',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    background: item.qty < 5 ? '#fee2e2' : item.qty < 15 ? '#fef3c7' : '#d1fae5',
                                    color: item.qty < 5 ? '#991b1b' : item.qty < 15 ? '#92400e' : '#065f46',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    textTransform: 'uppercase'
                                }}>
                                    {item.qty < 5 
                                        ? (lang === 'en' ? 'HURRY! Last few left!' : 'ಬೇಗ! ಕೊನೆಯ ಕೆಲವು ಬಾಕಿ!') 
                                        : item.qty < 15 
                                            ? (lang === 'en' ? 'Selling Fast!' : 'ವೇಗವಾಗಿ ಮಾರಾಟವಾಗುತ್ತಿದೆ!') 
                                            : (lang === 'en' ? 'Plenty available' : 'ಸಾಕಷ್ಟು ಲಭ್ಯವಿದೆ')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }
    

    // Owner / Staff management  views
    if (user === 'owner' || user === 'staff') {
        const tabs = user === 'owner'
            ? ['dash', 'goodsIn', 'inv', 'bill', 'billHist', 'credit', 'workers', 'shelf', 'analytics']
            : ['dash', 'goodsIn', 'inv', 'bill', 'billHist', 'workers'];

        const subtotal = cart.reduce((s, it) => s + (it.price * it.qty), 0);
        const tax = (subtotal * taxRate) / 100;
        const total = subtotal + tax;

        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
                <div style={{ background: 'linear-gradient(to right, #2563eb, #1e40af)', color: '#fff', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '20px', margin: '0 0 4px 0', fontWeight: '700' }}>{t.title}</h1>
                            <p style={{ fontSize: '13px', margin: 0, opacity: 0.9 }}>{user === 'owner' ? '👔 ' + t.owner : '👨‍🍳 ' + t.staff}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setLang(lang === 'en' ? 'kn' : 'en')} style={{ ...s.btn, background: '#fff', color: '#2563eb', fontSize: '12px', padding: '8px 14px' }}>🌐</button>
                            <button onClick={() => { setUser(null); setTab('dash'); }} style={{ ...s.btn, background: '#dc2626', color: '#fff', fontSize: '12px', padding: '8px 14px' }}>{t.logout}</button>
                        </div>
                    </div>
                </div>
                
                <div style={{ background: '#fff', padding: '0 20px', overflowX: 'auto', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderBottom: '1px solid #e5e7eb' }}>
                    {tabs.map(tb => (
                        <button key={tb} onClick={() => setTab(tb)}
                            style={{
                                padding: '14px 18px', border: 'none', background: 'none',
                                borderBottom: tab === tb ? '3px solid #2563eb' : '3px solid transparent',
                                color: tab === tb ? '#2563eb' : '#6b7280',
                                cursor: 'pointer', fontWeight: tab === tb ? '600' : '500', fontSize: '14px'
                            }}>{t[tb]}</button>
                    ))}
                </div>

                <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
             
                    {/* Dashboard Tab */}
{tab === 'dash' && (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
        
        {/* 1. TOP STATS OVERVIEW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatBox 
                label={t.items} 
                value={liveItems.reduce((sum, i) => sum + i.qty, 0)} 
                color="linear-gradient(135deg, #3b82f6, #2563eb)" 
            />
            <StatBox 
                label={t.lowStock} 
                value={liveItems.filter(i => i.isLowStock).length} 
                color="linear-gradient(135deg, #f97316, #ea580c)" 
            />
            <StatBox 
                label={t.expiring} 
                value={liveItems.filter(i => i.status === 'Expiring').length} 
                color="linear-gradient(135deg, #ef4444, #dc2626)" 
            />
        </div>

        {/* OWNER SPECIFIC ALERTS (Leaves & Credits) */}
        {user === 'owner' && (
            <>
                {/* 2. PENDING LEAVE ALERTS */}
                {leaves.filter(l => l.status === 'Pending').length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📩 {t.actionLeaves}
                            <span style={{ background: '#6366f1', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>{t.newBadge}</span>
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {leaves.filter(l => l.status === 'Pending').map(l => (
                                <div key={l.id} style={{ ...s.card, minWidth: '260px', borderLeft: '6px solid #6366f1', padding: '16px', margin: 0 }}>
                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{l.worker}</div>
                                    <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700', textTransform: 'uppercase' }}>{l.type}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', margin: '8px 0' }}>📅 {formatDate(l.startDate)} - {formatDate(l.endDate)}</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleLeaveAction(l.id, 'approve')} style={{ ...s.btn, flex: 1, padding: '8px', background: '#10b981', color: '#fff', fontSize: '12px' }}>{t.approve}</button>
                                        <button onClick={() => handleLeaveAction(l.id, 'reject')} style={{ ...s.btn, flex: 1, padding: '8px', background: '#fee2e2', color: '#ef4444', fontSize: '12px', border: 'none' }}>{t.reject}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. URGENT CREDIT ALERTS */}
                {credits.filter(c => c.status !== 'Paid' && (isExpired(c.expiryDate) || (new Date(c.expiryDate) - new Date()) / (1000*60*60*24) <= 7)).length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>🚩 {t.creditDue}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {credits.filter(c => c.status !== 'Paid' && (isExpired(c.expiryDate) || (new Date(c.expiryDate) - new Date()) / (1000*60*60*24) <= 7)).map(c => {
                                const overdue = isExpired(c.expiryDate);
                                return (
                                    <div key={c.id} style={{ ...s.card, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: overdue ? '#fff1f2' : '#fffbeb', borderLeft: `6px solid ${overdue ? '#ef4444' : '#f59e0b'}`, margin: 0 }}>
                                        <div>
                                            <div style={{ fontWeight: '800' }}>{c.name}</div>
                                            <div style={{ fontSize: '11px', color: overdue ? '#dc2626' : '#92400e', fontWeight: 'bold' }}>
                                                {overdue ? t.overdue : t.upcoming} ({formatDate(c.expiryDate)})
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '900', fontSize: '18px' }}>₹{c.amt}</div>
                                            <button onClick={() => updateCreditStatus(c.id, 'Paid')} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>✅ {t.markPaid}</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </>
        )}

        {/* 4. TODAY'S WASTE SUMMARY (FIXED: Filtered for Today) */}
<div style={{ padding: '16px', background: '#fef2f2', borderLeft: '6px solid #dc2626', borderRadius: '12px', marginBottom: '25px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <span style={{ fontWeight: '800', color: '#991b1b' }}>🗑️ {t.waste}</span>
            <p style={{ fontSize: '10px', color: '#dc2626', margin: 0, fontWeight: '700' }}>
                {lang === 'en' ? "TODAY'S TOTAL" : "ಇಂದಿನ ಒಟ್ಟು"}
            </p>
        </div>
        <span style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626' }}>
            ₹{inventoryStatus
                .filter(i => {
                    const isExpired = i.status === 'Expired';
                    const isToday = new Date(i.expiryDate).toDateString() === new Date().toDateString();
                    return isExpired && isToday;
                })
                .reduce((sum, i) => sum + (i.qty * (i.price || 0)), 0)}
        </span>
    </div>
</div>


        {/* 5. LIVE STOCK MONITOR GRID */}
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '800', color: '#1e293b' }}>📦 {t.liveInventory}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {liveItems.map((item, idx) => {
                const daysLeft = item.daysToExpiry;
                let statusColor = '#3b82f6'; 
                if (daysLeft <= 2) statusColor = '#ef4444';      
                else if (daysLeft <= 7) statusColor = '#f59e0b'; 

                return (
                    <div key={idx} style={{ 
                        ...s.card, margin: 0, padding: '12px', borderTop: `4px solid ${statusColor}`, 
                        minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', lineHeight: '1.2' }}>{item.name}</div>
                                <button 
                                    onClick={() => markAsWaste(item.id)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
                                    title={t.removeWaste}
                                >🗑️</button>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.shelf}: {item.shelf}</div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700' }}>
                                {t.qty}: <span style={{color: item.qty < 10 ? '#ef4444' : 'inherit'}}>{item.qty}</span>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: statusColor }}>
                                {daysLeft <= 0 ? t.expired : `${daysLeft} ${t.daysLeft || (lang === 'en' ? 'days left' : 'ದಿನ ಬಾಕಿ')}`}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
)}

                    {/* Goods In */}
{tab === 'goodsIn' && (
    <div style={{ ...s.card, borderTop: '6px solid #6366f1', animation: 'fadeIn 0.3s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🚚 {t.goodsIn}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{t.goodsInDesc}</p>
            </div>
            <button 
                onClick={() => {
                    setStockItemName('');
                    setStockItemPrice('');
                    setStockItemQty('');
                    setStockItemShelf('');
                    setStockSearchQuery('');
                }}
                style={{ ...s.btn, background: '#fee2e2', color: '#ef4444', padding: '8px 16px', fontSize: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
            >
                🧹 {lang === 'en' ? 'Reset' : 'ಖಾಲಿ ಮಾಡಿ'}
            </button>
        </div>

        {/* Selection Area - Clean & Organized */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            
            {/* LEFT: Search Column */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' }}>🔍 Quick Search</span>
                    </div>
                    
                    <input 
                        type="text" 
                        placeholder="Type to filter list..." 
                        style={{ ...s.input, marginBottom: '5px', padding: '10px', fontSize: '14px', borderRadius: '8px', background: '#fff' }}
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                    />
                    
                    {/* Animated Scrollable List */}
                    <div style={{ 
                        maxHeight: '140px', 
                        overflowY: 'auto', 
                        background: '#fff', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
                        animation: 'slideDown 0.4s ease-out' // Smooth entry animation
                    }}>
                        {items
                            .filter(item => item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()))
                            .map((item, index) => (
                                <div 
                                    key={index}
                                    onClick={() => {
                                        setStockItemName(item.name);
                                        setStockItemPrice(item.price);
                                        setStockItemShelf(item.shelf);
                                    }}
                                    style={{ 
                                        padding: '10px 15px', 
                                        fontSize: '13px', 
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f1f5f9',
                                        background: stockItemName === item.name ? '#eef2ff' : 'transparent',
                                        color: stockItemName === item.name ? '#6366f1' : '#334155',
                                        fontWeight: stockItemName === item.name ? '700' : '500',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <span>{item.name}</span>
                                    {stockItemName === item.name && <span>✅</span>}
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            
            {/* RIGHT: Confirmation/Manual Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#f0f7ff', padding: '12px', borderRadius: '12px', border: '1px solid #bae6fd', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', marginBottom: '8px', textTransform: 'uppercase' }}>
                        ✨ Selected Item Name
                    </span>
                    <input 
                        type="text" 
                        placeholder={lang === 'en' ? "Name of Item" : "ವಸ್ತುವಿನ ಹೆಸರು"} 
                        style={{ 
                            ...s.input, 
                            marginBottom: 0, 
                            fontWeight: '700',
                            border: '2px solid #0ea5e9',
                            fontSize: '15px',
                            background: '#fff'
                        }} 
                        value={stockItemName} 
                        onChange={e => setStockItemName(e.target.value)} 
                    />
                    {stockItemName && !items.some(i => i.name === stockItemName) && (
                        <div style={{ marginTop: '8px', padding: '4px 8px', background: '#0ea5e9', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', width: 'fit-content' }}>
                            NEW ITEM
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Details Grid (Price, Qty, Shelf, Expiry) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>💰 {t.price} (₹)</label>
                <input type="number" style={{ ...s.input, marginBottom: 0 }} value={stockItemPrice} onChange={e => setStockItemPrice(e.target.value)} />
            </div>
            <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>📦 {t.qty}</label>
                <input type="number" style={{ ...s.input, marginBottom: 0 }} value={stockItemQty} onChange={e => setStockItemQty(e.target.value)} />
            </div>
            <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>📍 {t.shelfID}</label>
                <select style={{ ...s.input, marginBottom: 0, height: '42px' }} value={stockItemShelf} onChange={(e) => setStockItemShelf(e.target.value)}>
                    <option value="">-- Shelf --</option>
                    {Object.keys(shelves).map(id => <option key={id} value={id}>{id}</option>)}
                </select>
            </div>
            <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px' }}>📅 {t.expiryDate}</label>
                <input type="date" style={{ ...s.input, marginBottom: 0 }} value={stockItemExpiryDate} onChange={e => setStockItemExpiryDate(e.target.value)} />
            </div>
        </div>
        
        <button 
            onClick={addStock} 
            style={{ 
                ...s.btn, 
                width: '100%', 
                background: '#6366f1', 
                color: '#fff', 
                padding: '16px', 
                fontSize: '17px', 
                fontWeight: '800', 
                borderRadius: '12px',
                transition: 'transform 0.1s active',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
        >
            {t.addStockBtn}
        </button>
    </div>
)}

{/* Add this to your global <style> or CSS file for the animations */}
<style>{`
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`}</style>


                    {/* Inventory */}
                    {tab === 'inv' && (
    <div style={s.card}>
      
        {/* TOP SECTION: Title, Search, and Filters */}
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>📦 {t.inv}</h3>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{lang === 'en' ? 'Urgent first' : 'ತುರ್ತು ಮೊದಲು'}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{t.invDesc}</p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* SEARCH BAR */}
                <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder={lang === 'en' ? "Search..." : "ಹುಡುಕಿ..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ ...s.input, marginBottom: 0, paddingLeft: '35px', background: '#f8fafc' }} 
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                </div>

                {/* STATUS FILTERS */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['All', 'Low Stock', 'Expired'].map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setInvFilter(filter)}
                            style={{
                                ...s.btn,
                                padding: '8px 12px',
                                fontSize: '12px',
                                background: invFilter === filter ? '#2563eb' : '#f1f5f9',
                                color: invFilter === filter ? '#fff' : '#475569',
                                border: 'none'
                            }}
                        >
                            {t[filter] || filter}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        {/* TABLE SECTION */}
        <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '600px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr', padding: '12px 10px', background: '#f8fafc', borderRadius: '8px', fontWeight: '700', color: '#64748b', fontSize: '12px', marginBottom: '10px' }}>
                    <span>{t.placeholderItemName}</span>
                    <span>{t.inventoryShelf}</span>
                    <span>{t.qty}</span>
                    <span>{t.expiryDate}</span>
                    <span style={{ textAlign: 'right' }}>{t.status}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {inventoryStatus
                        .filter(i => {
                            const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.shelf.toLowerCase().includes(searchQuery.toLowerCase());
                            if (invFilter === 'Expired') return matchesSearch && i.status === 'Expired';
                            if (invFilter === 'Low Stock') return matchesSearch && i.qty < 10 && i.status !== 'Expired';
                            return matchesSearch;
                        })
                        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                        .map(i => {
                            const isExpiredStatus = i.status === 'Expired';
                            const isLow = i.qty < 10 && !isExpiredStatus;

                            return (
                                <div key={i.id} style={{ 
                                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr', padding: '14px 10px', alignItems: 'center',
                                    background: isExpiredStatus ? '#fff1f2' : (isLow ? '#fffbeb' : 'white'),
                                    borderBottom: '1px solid #f1f5f9', borderRadius: '8px'
                                }}>
                                    <div style={{ fontWeight: '700', color: isExpiredStatus ? '#b91c1c' : '#1e293b' }}>{i.name}</div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>{i.shelf}</div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: isExpiredStatus ? '#b91c1c' : (isLow ? '#d97706' : '#166534') }}>{i.qty}</div>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>{formatDate(i.expiryDate)}</div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={s.badge(
                                            isExpiredStatus ? '#fee2e2' : i.status === 'Expiring' ? '#fef3c7' : '#dcfce7',
                                            isExpiredStatus ? '#991b1b' : i.status === 'Expiring' ? '#92400e' : '#166534'
                                        )}>{t[i.status]}</span>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    </div>
)}

                {/* Billing */}

{tab === 'bill' && (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ ...s.card, marginBottom: '20px', borderTop: '6px solid #10b981' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '800', color: '#1e293b' }}>
                🧮 {lang === 'en' ? 'Billing' : 'ಬಿಲ್ಲಿಂಗ್'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '12px' }}>
                
                {/* SEARCHABLE ITEM SELECTOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <input 
                        type="text" 
                        placeholder={lang === 'en' ? "🔍 Search items..." : "🔍 ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ..."} 
                        style={{ ...s.input, marginBottom: '8px', padding: '8px 12px', fontSize: '13px', background: '#fff', border: '1px solid #e2e8f0' }}
                        value={billSearchQuery}
                        onChange={(e) => setBillSearchQuery(e.target.value)}
                    />
                    
                    <div style={{ 
                        maxHeight: '130px', 
                        overflowY: 'auto', 
                        background: '#fff', 
                        borderRadius: '8px', 
                        border: '1px solid #edf2f7',
                        animation: 'slideDown 0.4s ease-out' 
                    }}>
                        {inventoryStatus
                            .filter(i => i.status !== 'Expired' && i.qty > 0 && i.name.toLowerCase().includes(billSearchQuery.toLowerCase()))
                            .map((item, idx) => {
                                const isCritical = item.qty < 5;
                                const isHigh = item.qty > 20;
                                
                                // Determine Badge Style
                                let badgeColor = '#475569';
                                let badgeBg = '#f1f5f9';
                                if (isCritical) { badgeColor = '#ef4444'; badgeBg = '#fee2e2'; }
                                else if (isHigh) { badgeColor = '#059669'; badgeBg = '#d1fae5'; }

                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => {
                                            setNewItemName(item.name);
                                            const itemData = inventoryStatus.find(i => i.name === item.name && i.status !== 'Expired');
                                            if (itemData) setNewItemPrice(itemData.price);
                                        }}
                                        style={{ 
                                            padding: '10px 12px', 
                                            fontSize: '13px', 
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f1f5f9',
                                            background: newItemName === item.name ? '#ecfdf5' : 'transparent',
                                            color: newItemName === item.name ? '#059669' : '#1e293b',
                                            fontWeight: newItemName === item.name ? '700' : '500',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span>{isCritical ? `⚠️ ${item.name}` : item.name}</span>
                                        
                                        <span style={{ 
                                            fontSize: '11px', 
                                            color: badgeColor, 
                                            background: badgeBg,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontWeight: '900',
                                            border: `1px solid ${isCritical ? '#fecaca' : isHigh ? '#a7f3d0' : '#e2e8f0'}`
                                        }}>
                                            {item.qty} {lang === 'en' ? 'left' : 'ಉಳಿದಿದೆ'}
                                        </span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                <input type="number" placeholder={t.placeholderPrice} style={{ ...s.input, marginBottom: 0, height: '45px' }}
                    value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} />
                
                <input type="number" placeholder={t.placeholderQty} style={{ ...s.input, marginBottom: 0, height: '45px' }}
                    value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} />
                
                <button onClick={addToCart} style={{ ...s.btn, background: '#10b981', color: '#fff', alignSelf: 'flex-end', height: '45px', width: '45px', padding: 0 }}>➕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                    {lang === 'en' ? 'Tax' : 'ತೆರಿಗೆ'} (%):
                </label>
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    style={{ width: '60px', padding: '5px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }} />
                {newItemName && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '900', color: '#10b981' }}>
                        🎯 {newItemName}
                    </span>
                )}
            </div>
        </div>

        {cart.length > 0 && (
            <div style={{ ...s.card, background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideDown 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
                        🛒 {lang === 'en' ? 'Current Cart' : 'ಈಗಿನ ಕಾರ್ಟ್'}
                    </h4>
                    <button onClick={() => setCart([])} style={{ ...s.btn, background: '#fee2e2', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>
                        {lang === 'en' ? 'Clear All' : 'ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ'}
                    </button>
                </div>
                
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '15px' }}>
                    {cart.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                            <span>{item.name} <b>x{item.qty}</b></span>
                            <span style={{ fontWeight: '700' }}>₹{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                    ))}
                    
                    <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: '#64748b' }}>
                            <span>{lang === 'en' ? 'Subtotal' : 'ಉಪ ಮೊತ್ತ'}:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#64748b' }}>
                            <span>{lang === 'en' ? 'Tax' : 'ತೆರಿಗೆ'} ({taxRate}%):</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '5px' }}>
                            <span>{lang === 'en' ? 'Grand Total' : 'ಒಟ್ಟು ಮೊತ್ತ'}:</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => generateBill(subtotal, tax, total)} 
                        style={{ ...s.btn, width: '100%', background: 'linear-gradient(135deg, #2563eb, #1e40af)', color: '#fff', marginTop: '15px', padding: '16px', fontSize: '16px', fontWeight: '800' }}
                    >
                        {lang === 'en' ? 'Generate Bill' : 'ಬಿಲ್ ತಯಾರಿಸಿ'}
                    </button>
                </div>
            </div>
        )}
    </div>
)}

                {/* Bill History */}
                {tab === 'billHist' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Modern Search & Title Header */}
        <div style={s.headerGrad}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>📊 {t.billHist}</h3>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {bills.length} Transactions
                </span>
            </div>
            <div style={{ position: 'relative' }}>
                <input 
                    type="text" 
                    placeholder={lang === 'en' ? "Search by Item or ID..." : "ಹುಡುಕಿ..."}
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: 'none', 
                        background: 'rgba(255,255,255,0.9)', color: '#1e293b', outline: 'none' 
                    }} 
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>🔍</span>
            </div>
        </div>

        {/* The List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bills.slice().reverse()
                .filter(b => b.id.toString().includes(billSearch) || b.items.some(it => it.name.toLowerCase().includes(billSearch.toLowerCase())))
                .map(b => (
                <div key={b.id} style={{ 
                    ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', transition: 'transform 0.2s', cursor: 'pointer',
                    borderLeft: '6px solid #10b981' // Green stripe for success
                }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Round Icon Box */}
                        <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            🧾
                        </div>
                        
                        <div>
                            <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>
                                #{b.id.toString().slice(-6)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                {b.time}
                            </div>
                            {/* Tags for items sold */}
                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                                {b.items.map((it, i) => (
                                    <span key={i} style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        {it.name} x{it.qty}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#065f46' }}>
                            ₹{b.total.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Tax: ₹{b.tax.toFixed(0)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
)}

                    {/* WORKERS & LEAVE MANAGEMENT - FULL UPDATED BLOCK */}
{tab === 'workers' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', animation: 'fadeIn 0.4s ease' }}>
    
    {/* 1. ADD NEW WORKER (Owner Only) */}
    {user === 'owner' && (
      <div style={{ ...s.card, border: '1px solid #e2e8f0', background: '#fff' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
          👤 {t.addWorker || 'Add New Worker'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
          <input 
            type="text" 
            placeholder={t.workerNamePlaceholder || "Worker Name"} 
            style={{ ...s.input, marginBottom: 0 }} 
            value={newWorkerName} 
            onChange={e => setNewWorkerName(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder={t.workerRolePlaceholder || "Role (e.g. Chef)"} 
            style={{ ...s.input, marginBottom: 0 }} 
            value={newWorkerRole} 
            onChange={e => setNewWorkerRole(e.target.value)} 
          />
          <button onClick={addWorker} style={{ ...s.btn, background: '#2563eb', color: '#fff', fontWeight: '700', padding: '0 20px' }}>
            {t.addWorkerBtn || 'Add'}
          </button>
        </div>
      </div>
    )}

    {/* 2. OWNER ACTION ZONE: PENDING REQUESTS (Stays on top until Approved/Rejected) */}
    {user === 'owner' && leaves.filter(l => l.status === 'Pending').length > 0 && (
      <div style={{ ...s.card, borderLeft: '6px solid #f59e0b', background: '#fffbeb' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏳ {lang === 'en' ? 'Pending Sanctions' : 'ಬಾಕಿ ಇರುವ ರಜೆಗಳು'}
          <span style={{ fontSize: '10px', background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>NEW</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leaves.filter(l => l.status === 'Pending').map(l => (
            <div key={l.id} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '14px', background: '#fff', borderRadius: '12px', border: '1px solid #fef3c7',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ fontWeight: '800', color: '#1e293b' }}>{l.worker}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {l.type} | {formatDate(l.startDate)} - {formatDate(l.endDate)}
                </div>
                {l.note && <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>"{l.note}"</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleLeaveAction(l.id, 'approve')} style={{ ...s.btn, padding: '8px 12px', background: '#10b981', color: '#fff', fontSize: '12px', border: 'none' }}>Approve</button>
                <button onClick={() => handleLeaveAction(l.id, 'reject')} style={{ ...s.btn, padding: '8px 12px', background: '#fee2e2', color: '#ef4444', fontSize: '12px', border: 'none' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* 3. WORKER LIST (The Main Gallery) */}
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
        👥 {lang === 'en' ? 'Our Team' : 'ನಮ್ಮ ತಂಡ'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
        {workersList.map(w => {
          // Calculate only Approved (Sanctioned) leaves
          const sanctionedCount = leaves.filter(l => l.worker === w.name && l.status === 'Approved').length;
          return (
            <div key={w.id} style={{ 
              ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              borderLeft: '6px solid #6366f1', padding: '16px 20px', background: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👨‍🍳</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{w.name}</div>
                  <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700', textTransform: 'uppercase' }}>{w.role}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  background: sanctionedCount > 5 ? '#fee2e2' : '#f0fdf4', 
                  color: sanctionedCount > 5 ? '#dc2626' : '#16a34a',
                  padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', border: '1px solid currentColor'
                }}>
                  {sanctionedCount} {lang === 'en' ? 'LEAVES' : 'ರಜೆಗಳು'}
                </div>
                {user === 'owner' && (
                  <button onClick={() => startEditWorker(w)} style={{ border: 'none', background: 'none', color: '#2563eb', fontWeight: '700', fontSize: '11px', textDecoration: 'underline', marginTop: '6px', cursor: 'pointer' }}>
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* 4. STAFF VIEW: APPLY FOR LEAVE */}
{user === 'staff' && (
  <div style={{ ...s.card, borderTop: '6px solid #f97316' }}>
    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>
      🗓️ {t.applyLeave}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <select style={s.input} value={leaveWorkerId} onChange={e => setLeaveWorkerId(parseInt(e.target.value))}>
          <option value="">{t.selectWorker}</option>
          {workersList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select style={s.input} value={newLeaveType} onChange={e => setNewLeaveType(e.target.value)}>
          <option value="">{t.leaveType}</option>
          <option value="Sick Leave">{t.sickLeave}</option>
          <option value="Personal">{t.personalLeave}</option>
          <option value="Casual">{t.casualLeave}</option>
        </select>
      </div>
      <textarea 
        placeholder={t.leaveReason} 
        style={{ ...s.input, minHeight: '60px' }} 
        value={newLeaveNote} 
        onChange={e => setNewLeaveNote(e.target.value)} 
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
        <input type="date" style={s.input} value={newLeaveStartDate} onChange={e => setNewLeaveStartDate(e.target.value)} />
        <input type="date" style={s.input} value={newLeaveEndDate} onChange={e => setNewLeaveEndDate(e.target.value)} />
        <button onClick={applyLeaveRequest} style={{ ...s.btn, background: '#f97316', color: '#fff', fontWeight: 'bold' }}>
          {t.submit}
        </button>
      </div>
    </div>
  </div>
)}


    {/* 5. LEAVE HISTORY (Sanctioned or Rejected Records) */}
    <div style={{ ...s.card, background: '#f8fafc' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '15px' }}>📜 {lang === 'en' ? 'Leave History' : 'ರಜೆ ಇತಿಹಾಸ'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {leaves.filter(l => l.status !== 'Pending').slice().reverse().map(l => (
          <div key={l.id} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '12px 16px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' 
          }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{l.worker}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{l.type} • {formatDate(l.startDate)} to {formatDate(l.endDate)}</div>
            </div>
            
<span style={{ 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '4px 10px', 
    borderRadius: '20px',
    background: l.status === 'Approved' ? '#dcfce7' : (l.status === 'Rejected' ? '#fee2e2' : '#fef3c7'),
    color: l.status === 'Approved' ? '#166534' : (l.status === 'Rejected' ? '#991b1b' : '#92400e'),
    textTransform: 'uppercase'
}}>
    {/* Dynamic translation based on status */}
    {l.status === 'Approved' ? t.sanctioned : 
     l.status === 'Rejected' ? t.rejected : t.pending}
</span>

      
        </div>
        ))}
        {leaves.filter(l => l.status !== 'Pending').length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '10px' }}>No leave history found.</p>
        )}
      </div>
    </div>
  </div>
)}

                    {/* Credit (Owner only) */}
{tab === 'credit' && user === 'owner' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' }}>
        
        {/* Header Section */}
        <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 5px 0' }}>💳 {t.credit}</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', color: '#64748b' }}>{t.creditDesc}</p>
        </div>
        
        {/* 1. TOTAL DEBT SUMMARY CARD */}
        <div style={{ 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
            padding: '24px', borderRadius: '20px', color: '#fff', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' 
        }}>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', fontWeight: '600' }}>
                {lang === 'en' ? 'TOTAL OUTSTANDING' : 'ಒಟ್ಟು ಬಾಕಿ ಇರುವ ಮೊತ್ತ'}
            </p>
            <h2 style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '900' }}>
                ₹{credits.filter(c => c.status !== 'Paid').reduce((sum, c) => sum + c.amt, 0).toFixed(2)}
            </h2>
        </div>

        {/* 2. ISSUE NEW CREDIT FORM */}
        <div style={{ ...s.card, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                {t.issueNewCredit}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder={t.placeholderCreditName} 
                    style={{ ...s.input, marginBottom: 0 }} 
                    value={newCreditName} 
                    onChange={e => setNewCreditName(e.target.value)} 
                />
                <input 
                    type="number" 
                    placeholder="₹" 
                    style={{ ...s.input, marginBottom: 0 }} 
                    value={newCreditAmount} 
                    onChange={e => setNewCreditAmount(e.target.value)} 
                />
                <button onClick={addCreditRecord} style={{ ...s.btn, background: '#2563eb', color: '#fff', fontWeight: '700' }}>
                    {lang === 'en' ? 'Issue' : 'ನೀಡಿ'}
                </button>
            </div>
        </div>

        {/* 3. SEARCH & FILTERS */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
                <input 
                    type="text" 
                    placeholder={lang === 'en' ? "Search Customer..." : "ಹುಡುಕಿ..."}
                    value={creditSearch}
                    onChange={(e) => setCreditSearch(e.target.value)}
                    style={{ ...s.input, marginBottom: 0, paddingLeft: '40px', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }} 
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            </div>
            <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                {['All', 'Not Paid', 'Paid'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setCreditFilter(f)}
                        style={{
                            ...s.btn, padding: '6px 12px', fontSize: '11px', borderRadius: '8px',
                            background: creditFilter === f ? '#fff' : 'transparent',
                            color: creditFilter === f ? '#2563eb' : '#64748b',
                            boxShadow: creditFilter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            border: 'none'
                        }}
                    >
                        {f === 'Not Paid' ? (lang === 'en' ? 'Unpaid' : 'ಬಾಕಿ') : 
                         f === 'Paid' ? (lang === 'en' ? 'Paid' : 'ಪಾವತಿ') : (lang === 'en' ? 'All' : 'ಎಲ್ಲಾ')}
                    </button>
                ))}
            </div>
        </div>

        {/* 4. CUSTOMER LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {credits.slice().reverse()
                .filter(c => {
                    const matchesSearch = c.name.toLowerCase().includes(creditSearch.toLowerCase());
                    const matchesFilter = creditFilter === 'All' || c.status === creditFilter;
                    return matchesSearch && matchesFilter;
                })
                .map(c => {
                    const isPaid = c.status === 'Paid';
                    return (
                        <div key={c.id} style={{ 
                            ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderLeft: `6px solid ${isPaid ? '#10b981' : '#ef4444'}`,
                            padding: '16px 20px',
                            opacity: isPaid ? 0.8 : 1,
                            margin: 0
                        }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                                    {c.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                    📅 {lang === 'en' ? 'Due:' : 'ಗಡುವು:'} <strong>{formatDate(c.expiryDate)}</strong>
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ marginRight: '10px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: isPaid ? '#059669' : '#dc2626' }}>
                                        ₹{c.amt}
                                    </div>
                                    <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: isPaid ? '#10b981' : '#ef4444' }}>
                                        {isPaid ? t.paid : t.notPaid}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => updateCreditStatus(c.id, isPaid ? 'Not Paid' : 'Paid')}
                                    style={{
                                        ...s.btn, padding: '0', borderRadius: '10px', width: '38px', height: '38px',
                                        background: isPaid ? '#dcfce7' : '#fee2e2',
                                        border: 'none',
                                        color: isPaid ? '#166534' : '#991b1b',
                                        fontSize: '16px'
                                    }}
                                >
                                    {isPaid ? '↩️' : '✔'}
                                </button>
                            </div>
                        </div>
                    );
                })}
        </div>
    </div>
)}


                    {/* Shelf Map (Owner only)*/}
{tab === 'shelf' && (
    <div style={{ animation: 'slideUp 0.4s ease-out', padding: '10px' }}>
        
        {/* ENHANCED TITLE SECTION */}
        <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '950', 
                color: '#0f172a', 
                letterSpacing: '-1px', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', width: '8px', height: '32px', borderRadius: '4px' }}></span>
                {lang === 'en' ? 'Live Inventory Map' : 'ಲೈವ್ ಇನ್ವೆಂಟರಿ ಮ್ಯಾಪ್'}
            </h2>
            <div style={{ height: '2px', width: '60px', background: '#e2e8f0', marginTop: '8px' }}></div>
        </div>

        {/* 1. ADD NEW SHELF SECTION (Kept at Top) */}
        <div style={{ 
            background: '#ffffff', 
            padding: '20px', 
            borderRadius: '20px', 
            marginBottom: '25px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
        }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: '800', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>➕</span> {lang === 'en' ? 'Add New Storage Location' : 'ಹೊಸ ಶೇಖರಣಾ ಸ್ಥಳವನ್ನು ಸೇರಿಸಿ'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px' }}>
                <input placeholder={lang === 'en' ? "Shelf ID (e.g. A1)" : "ಶೆಲ್ಫ್ ಐಡಿ"} style={{ ...s.input, marginBottom: 0, borderRadius: '12px' }} value={newShelfId} onChange={e => setNewShelfId(e.target.value)} />
                <input placeholder={lang === 'en' ? "Assigned Items (Bread, Cake...)" : "ವಸ್ತುಗಳು (ಬ್ರೆಡ್, ಕೇಕ್...)"} style={{ ...s.input, marginBottom: 0, borderRadius: '12px' }} value={newShelfItems} onChange={e => setNewShelfItems(e.target.value)} />
                <button onClick={addShelfRecord} style={{ ...s.btn, background: '#0f172a', color: '#fff', fontWeight: '800', borderRadius: '12px', padding: '0 30px' }}>
                    {lang === 'en' ? 'Create' : 'ರಚಿಸಿ'}
                </button>
            </div>
        </div>

        {/* 2. SEARCH BAR (Now positioned after Add section) */}
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                <input 
                    type="text" 
                    placeholder={lang === 'en' ? "Quick search shelf or product..." : "ಶೆಲ್ಫ್ ಅಥವಾ ಐಟಂ ಹುಡುಕಿ..."}
                    style={{ 
                        ...s.input, 
                        paddingLeft: '45px', 
                        borderRadius: '15px', 
                        border: '2px solid #e2e8f0', 
                        marginBottom: 0,
                        height: '45px',
                        fontSize: '14px',
                        background: '#fff',
                        transition: 'all 0.3s ease'
                    }}
                    value={shelfSearch}
                    onChange={(e) => setShelfSearch(e.target.value)} 
                />
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>🔍</span>
            </div>
        </div>

        {/* 3. COLORED SHELF GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {Object.entries(shelves)
                .filter(([id, itemsList]) => {
                    const term = (shelfSearch || '').toLowerCase();
                    return id.toLowerCase().includes(term) || itemsList.some(i => i.toLowerCase().includes(term));
                })
                .map(([id, itemsList]) => {
                    const isEditing = editingShelfId === id;

                    // Deep Color Palette
                    const colors = [
                        { bg: '#f5f7ff', text: '#4338ca', border: '#c7d2fe', accent: '#6366f1' }, // Indigo
                        { bg: '#fffaf5', text: '#9a3412', border: '#ffedd5', accent: '#f97316' }, // Orange
                        { bg: '#f0fdf4', text: '#166534', border: '#dcfce7', accent: '#22c55e' }, // Green
                        { bg: '#fdf2f8', text: '#9d174d', border: '#fce7f3', accent: '#ec4899' }, // Pink
                        { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', accent: '#64748b' }  // Slate
                    ];
                    const theme = colors[id.charCodeAt(0) % colors.length];

                    const liveStock = items.filter(i => 
                        i.shelf && i.shelf.toUpperCase() === id.toUpperCase() && 
                        i.qty > 0 && 
                        !isExpired(i.expiryDate)
                    );
                    
                    const stockNames = liveStock.map(i => i.name.toLowerCase());
                    const allDisplayNames = Array.from(new Set([...itemsList.map(n => n.toLowerCase()), ...stockNames]));

                    return (
                        <div key={id} style={{ 
                            background: '#fff', 
                            borderRadius: '24px', 
                            overflow: 'hidden',
                            border: isEditing ? `2px solid #ef4444` : `1px solid ${theme.border}`,
                            boxShadow: '0 10px 20px rgba(0,0,0,0.02)',
                            transition: 'transform 0.2s ease'
                        }}>
                            {/* Card Header */}
                            <div style={{ background: isEditing ? '#fee2e2' : theme.bg, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        height: '34px', width: '34px', 
                                        background: isEditing ? '#fff' : theme.accent, 
                                        borderRadius: '10px', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        fontWeight: '900', color: isEditing ? '#ef4444' : '#fff', fontSize: '14px' 
                                    }}>
                                        {id.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '19px', fontWeight: '900', color: '#1e293b' }}>{id}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {isEditing ? (
                                        <>
                                            <button onClick={() => {
                                                if(window.confirm(lang === 'en' ? "Delete?" : "ಅಳಿಸಬೇಕೆ?")) {
                                                    const newShelves = {...shelves}; delete newShelves[id]; setShelves(newShelves); setEditingShelfId(null);
                                                }
                                            }} style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                                                {lang === 'en' ? 'Delete' : 'ಅಳಿಸು'}
                                            </button>
                                            <button onClick={saveEditShelf} style={{ border: 'none', background: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                                                {lang === 'en' ? 'Save' : 'ಉಳಿಸಿ'}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => startEditShelf(id, itemsList)} style={{ border: `1.5px solid ${theme.border}`, background: '#fff', color: theme.text, padding: '5px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                                            {lang === 'en' ? 'Edit' : 'ತಿದ್ದು'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '20px' }}>
                                {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <input style={{...s.input, marginBottom: 0}} value={editingNewId} onChange={e => setEditingNewId(e.target.value)} />
                                        <input style={{...s.input, marginBottom: 0}} value={editingNewItems} onChange={e => setEditingNewItems(e.target.value)} />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {allDisplayNames.map((name, index) => {
                                            const itemInStock = liveStock.find(i => i.name.toLowerCase() === name);
                                            const hasStock = !!itemInStock;

                                            return (
                                                <div key={index} style={{ 
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '14px', borderRadius: '15px',
                                                    background: hasStock ? '#fff' : '#f8fafc',
                                                    border: `1px solid ${hasStock ? theme.border : '#f1f5f9'}`,
                                                    boxShadow: hasStock ? '0 2px 4px rgba(0,0,0,0.02)' : 'none'
                                                }}>
                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: hasStock ? '#1e293b' : '#94a3b8' }}>
                                                        {name.toUpperCase()}
                                                    </span>
                                                    {hasStock ? (
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '900', color: theme.accent }}>{itemInStock.qty} QTY</div>
                                                            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>{lang === 'en' ? 'LIVE' : 'ದಾಸ್ತಾನು'}</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '800' }}>EMPTY</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {allDisplayNames.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '15px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                                {lang === 'en' ? 'No items tracked here' : 'ಯಾವುದೇ ವಸ್ತುಗಳಿಲ್ಲ'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
        </div>
    </div>
)}

                    {/* Analytics (Owner) */}
                    {tab === 'analytics' && user === 'owner' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={s.headerGrad}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>📊 {t.monthlyWaste}</h3>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>{t.wasteReviewDesc}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {periodicWasteAnalysis.map((periodData, idx) => (
                <div key={idx} style={{
                    ...s.card,
                    borderTop: `6px solid ${periodData.totalLoss > 0 ? '#ef4444' : '#10b981'}`,
                    display: 'flex', flexDirection: 'column', gap: '15px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{periodData.label}</h4>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Since {periodData.startDate}</span>
                        </div>
                        <div style={{
                            background: periodData.totalLoss > 0 ? '#fee2e2' : '#dcfce7',
                            padding: '8px 12px', borderRadius: '12px', textAlign: 'right'
                        }}>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: periodData.totalLoss > 0 ? '#991b1b' : '#166534' }}>
                                ₹{periodData.totalLoss.toFixed(0)}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '15px', padding: '15px' }}>
                        {periodData.itemsLost.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '10px' }}>✅ {t.noWaste}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {periodData.itemsLost.slice(0, 5).map((item, iIdx) => (
                                    <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#475569', fontWeight: '600' }}>{item.name} <small style={{color:'#94a3b8'}}>x{item.qty}</small></span>
                                        <span style={{ color: '#ef4444', fontWeight: '700' }}>-₹{item.loss.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default BSOMS;
