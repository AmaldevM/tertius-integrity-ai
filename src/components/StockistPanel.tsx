import React, { useState, useEffect } from 'react';
import { Stockist, PrimarySale, SecondarySale, InventoryItem } from '../types';
import { getStockists, saveStockist, recordPrimarySale, recordSecondarySale, getPrimarySales, getSecondarySales } from '../services/mockDatabase';
import { MOCK_INVENTORY_ITEMS } from '../constants';
import { Plus, Package, TrendingUp, TrendingDown, Truck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const StockistPanel: React.FC = () => {
    const [stockists, setStockists] = useState<Stockist[]>([]);
    const [selectedStockist, setSelectedStockist] = useState<Stockist | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPrimaryModal, setShowPrimaryModal] = useState(false);
    const [showSecondaryModal, setShowSecondaryModal] = useState(false);

    // Form States
    const [newStockistName, setNewStockistName] = useState('');
    const [saleItems, setSaleItems] = useState<{ itemId: string; quantity: number }[]>([{ itemId: '', quantity: 0 }]);

    useEffect(() => {
        loadStockists();
    }, []);

    const loadStockists = async () => {
        const data = await getStockists();
        setStockists(data);
    };

    const handleAddStockist = async () => {
        if (!newStockistName) return;
        const newStockist: Stockist = {
            id: uuidv4(),
            name: newStockistName,
            territoryId: 'TERR-001', // Mock default
            currentStock: {}
        };
        await saveStockist(newStockist);
        setNewStockistName('');
        setShowAddModal(false);
        loadStockists();
    };

    const handlePrimarySale = async () => {
        if (!selectedStockist) return;
        const totalAmount = saleItems.reduce((sum, item) => {
            const product = MOCK_INVENTORY_ITEMS.find(i => i.id === item.itemId);
            return sum + (product ? product.unitPrice * item.quantity : 0);
        }, 0);

        const sale: PrimarySale = {
            id: uuidv4(),
            date: new Date().toISOString(),
            stockistId: selectedStockist.id,
            items: saleItems.map(i => {
                const p = MOCK_INVENTORY_ITEMS.find(prod => prod.id === i.itemId);
                return { ...i, rate: p?.unitPrice || 0, amount: (p?.unitPrice || 0) * i.quantity };
            }),
            totalAmount,
            status: 'APPROVED'
        };

        await recordPrimarySale(sale);
        setShowPrimaryModal(false);
        setSaleItems([{ itemId: '', quantity: 0 }]);
        loadStockists(); // Refresh stock
        // Re-select to update view
        const updated = (await getStockists()).find(s => s.id === selectedStockist.id);
        setSelectedStockist(updated || null);
    };

    const handleSecondarySale = async () => {
        if (!selectedStockist) return;
        const totalAmount = saleItems.reduce((sum, item) => {
            const product = MOCK_INVENTORY_ITEMS.find(i => i.id === item.itemId);
            return sum + (product ? product.unitPrice * item.quantity : 0);
        }, 0);

        const sale: SecondarySale = {
            id: uuidv4(),
            date: new Date().toISOString(),
            stockistId: selectedStockist.id,
            customerId: 'CUST-001', // Mock Customer
            mrId: 'MR-001', // Mock MR
            items: saleItems.map(i => {
                const p = MOCK_INVENTORY_ITEMS.find(prod => prod.id === i.itemId);
                return { ...i, rate: p?.unitPrice || 0, amount: (p?.unitPrice || 0) * i.quantity };
            }),
            totalAmount
        };

        await recordSecondarySale(sale);
        setShowSecondaryModal(false);
        setSaleItems([{ itemId: '', quantity: 0 }]);
        loadStockists();
        const updated = (await getStockists()).find(s => s.id === selectedStockist.id);
        setSelectedStockist(updated || null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Stockist Management</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add Stockist
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stockist List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold">Stockists</div>
                    <div className="divide-y divide-slate-100">
                        {stockists.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedStockist(s)}
                                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedStockist?.id === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                            >
                                <div className="font-medium text-slate-800">{s.name}</div>
                                <div className="text-xs text-slate-500 mt-1">Territory: {s.territoryId}</div>
                            </div>
                        ))}
                        {stockists.length === 0 && <div className="p-8 text-center text-slate-400">No stockists found</div>}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="md:col-span-2 space-y-6">
                    {selectedStockist ? (
                        <>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">{selectedStockist.name}</h2>
                                        <p className="text-slate-500 text-sm">ID: {selectedStockist.id}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowPrimaryModal(true)}
                                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                                        >
                                            <Truck size={16} /> Primary Billing (In)
                                        </button>
                                        <button
                                            onClick={() => setShowSecondaryModal(true)}
                                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-1"
                                        >
                                            <TrendingUp size={16} /> Secondary Sales (Out)
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                    <Package size={18} /> Current Inventory
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {Object.entries(selectedStockist.currentStock).map(([itemId, qty]) => {
                                        const item = MOCK_INVENTORY_ITEMS.find(i => i.id === itemId);
                                        return (
                                            <div key={itemId} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="text-sm font-medium text-slate-700">{item?.name || itemId}</div>
                                                <div className="text-2xl font-bold text-blue-600 mt-1">{qty}</div>
                                                <div className="text-xs text-slate-400">Units</div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(selectedStockist.currentStock).length === 0 && (
                                        <div className="col-span-3 text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            No stock available. Record a Primary Sale to add inventory.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[400px]">
                            <Package size={48} className="mb-4 opacity-20" />
                            <p>Select a stockist to view inventory and manage sales</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Stockist Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 max-w-full">
                        <h3 className="text-lg font-bold mb-4">Add New Stockist</h3>
                        <input
                            type="text"
                            placeholder="Stockist Name"
                            className="w-full p-2 border rounded mb-4"
                            value={newStockistName}
                            onChange={e => setNewStockistName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button onClick={handleAddStockist} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Primary/Secondary Sale Modal (Reused Logic) */}
            {(showPrimaryModal || showSecondaryModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[500px] max-w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {showPrimaryModal ? 'Record Primary Sale (HO -> Stockist)' : 'Record Secondary Sale (Stockist -> Clinic)'}
                        </h3>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {saleItems.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <select
                                        className="flex-1 p-2 border rounded"
                                        value={item.itemId}
                                        onChange={e => {
                                            const newItems = [...saleItems];
                                            newItems[idx].itemId = e.target.value;
                                            setSaleItems(newItems);
                                        }}
                                    >
                                        <option value="">Select Product</option>
                                        {MOCK_INVENTORY_ITEMS.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        className="w-24 p-2 border rounded"
                                        value={item.quantity}
                                        onChange={e => {
                                            const newItems = [...saleItems];
                                            newItems[idx].quantity = parseInt(e.target.value) || 0;
                                            setSaleItems(newItems);
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setSaleItems([...saleItems, { itemId: '', quantity: 0 }])}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                + Add Item
                            </button>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowPrimaryModal(false);
                                    setShowSecondaryModal(false);
                                    setSaleItems([{ itemId: '', quantity: 0 }]);
                                }}
                                className="px-4 py-2 text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showPrimaryModal ? handlePrimarySale : handleSecondarySale}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Confirm Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
