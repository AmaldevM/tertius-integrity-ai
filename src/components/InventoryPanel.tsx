
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, InventoryItem, UserStock, StockTransaction } from '../types';
import { getInventoryItems, getUserStock, getAllUsers, distributeStock, getStockTransactions } from '../services/mockDatabase';
import { Button } from './Button';
import { Package, Send, Plus, Search, History, ArrowRight, ArrowLeft } from 'lucide-react';

interface InventoryPanelProps {
  currentUser: UserProfile;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ currentUser }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [myStock, setMyStock] = useState<UserStock[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  // Admin Distribution State
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [qty, setQty] = useState(0);

  useEffect(() => {
    loadData();
  }, [currentUser.uid]);

  const loadData = async () => {
    const i = await getInventoryItems();
    setItems(i);
    const s = await getUserStock(currentUser.uid);
    setMyStock(s);

    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.ASM) {
      const u = await getAllUsers();
      setAllUsers(u);
    }

    // Load History
    const tx = await getStockTransactions(currentUser.role === UserRole.ADMIN ? undefined : currentUser.uid);
    setTransactions(tx);
  };

  const handleIssueStock = async () => {
    if (!selectedUser || !selectedItem || qty <= 0) {
      alert("Please select user, item and quantity");
      return;
    }
    await distributeStock(selectedUser, selectedItem, qty);
    alert("Stock Issued Successfully!");
    setQty(0);
    loadData(); // Refresh history
  };

  const isAdminOrAsm = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.ASM;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* 1. My Hand Stock */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4">
          <Package className="mr-2 text-blue-600" />
          {isAdminOrAsm ? 'Inventory Master' : 'My Hand Stock'}
        </h2>

        {myStock.length === 0 ? (
          <p className="text-slate-500 text-sm">No stock currently assigned to you.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {myStock.map(s => (
              <div key={s.itemId} className="border rounded p-3 flex flex-col justify-between bg-slate-50">
                <div>
                  <div className="font-semibold text-slate-700">{s.itemName}</div>
                  <div className="text-xs text-slate-500 mb-2">Item ID: {s.itemId}</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{s.quantity} <span className="text-xs text-slate-400 font-normal">units</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Issue Stock (Admin/ASM Only) */}
      {isAdminOrAsm && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4 border-b pb-2">
            <Send className="mr-2 text-green-600" />
            Issue / Distribute Stock
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select MR / Manager</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
              >
                <option value="">-- Select Recipient --</option>
                {allUsers.filter(u => u.uid !== 'admin1').map(u => (
                  <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Item</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
              >
                <option value="">-- Select Item --</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
              />
            </div>

            <Button onClick={handleIssueStock} disabled={!selectedUser || !selectedItem}>
              <Plus size={16} className="mr-2" /> Issue Stock
            </Button>
          </div>
        </div>
      )}

      {/* 3. Transaction History (Ledger) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4 border-b pb-2">
          <History className="mr-2 text-slate-600" />
          Stock Transactions (History)
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No history available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map(tx => {
                  const isIssue = tx.type === 'ISSUE';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap text-slate-600">
                        {new Date(tx.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isIssue ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {isIssue ? 'RECEIVED / ISSUED' : 'GIVEN TO DOCTOR'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{tx.itemName}</td>
                      <td className="p-3 text-right font-bold">{tx.quantity}</td>
                      <td className="p-3 text-slate-500 text-xs">
                        {isIssue ? (
                          <div className="flex items-center gap-1">
                            <span>Admin</span> <ArrowRight size={12} /> <span>{allUsers.find(u => u.uid === tx.toUserId)?.displayName || 'User'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>Given to Customer ID: {tx.toUserId}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
