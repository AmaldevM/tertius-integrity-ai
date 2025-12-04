
import React, { useState, useEffect } from 'react';
import { UserProfile, Customer, VisitRecord, DailyAttendance, UserStock, CustomerType, CustomerCategory } from '../types';
import { getDailyAttendance, getCustomersByTerritory, saveVisit, getVisits, saveCustomer, getAllUsers, getUserStock, getVisitsForCustomer } from '../services/mockDatabase';
import { getCurrentPosition, getDistanceFromLatLonInMeters } from '../utils';
import { Button } from './Button';
import { MapPin, CheckCircle, Users, AlertTriangle, PackagePlus, MessageSquare, ListTodo, Box, Plus, UserPlus, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FieldReportingProps {
  user: UserProfile;
}

export const FieldReporting: React.FC<FieldReportingProps> = ({ user }) => {
  const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<GeolocationPosition | null>(null);
  const [jointWith, setJointWith] = useState<string>('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // View Toggle
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Inventory State
  const [myStock, setMyStock] = useState<UserStock[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ itemId: string, qty: number }[]>([]);

  // Visit Details State
  const [activeCustId, setActiveCustId] = useState<string | null>(null);
  const [productsDiscussed, setProductsDiscussed] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');

  // History State
  const [historyVisits, setHistoryVisits] = useState<VisitRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Customer State
  const [newCustName, setNewCustName] = useState('');
  const [newCustType, setNewCustType] = useState<CustomerType>(CustomerType.DOCTOR);
  const [newCustCategory, setNewCustCategory] = useState<CustomerCategory>(CustomerCategory.C);
  const [newCustSpecialty, setNewCustSpecialty] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLat, setNewCustLat] = useState<number | null>(null);
  const [newCustLng, setNewCustLng] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    init();
  }, [user.uid]);

  useEffect(() => {
    if (activeCustId) {
      loadHistory(activeCustId);
    } else {
      setHistoryVisits([]);
    }
  }, [activeCustId]);

  const init = async () => {
    // 1. Check Attendance
    const att = await getDailyAttendance(user.uid, todayStr);
    setAttendance(att);

    // 2. If punched in, get territory customers
    if (att?.punchIn?.verifiedTerritoryId) {
      const c = await getCustomersByTerritory(att.punchIn.verifiedTerritoryId);
      setCustomers(c);
    }

    // 3. Get existing visits today
    const v = await getVisits(user.uid, todayStr);
    setVisits(v);

    const u = await getAllUsers();
    setAllUsers(u.filter(x => x.uid !== user.uid));

    const s = await getUserStock(user.uid);
    setMyStock(s);
  };

  const loadHistory = async (custId: string) => {
    setLoadingHistory(true);
    const v = await getVisitsForCustomer(custId);
    // Sort descending by date
    const sorted = v.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setHistoryVisits(sorted);
    setLoadingHistory(false);
  };

  const handleTagLocation = async (customer: Customer) => {
    if (!confirm("Are you at the doctor's clinic now? This will lock the location.")) return;
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const updated = { ...customer, geoLat: pos.coords.latitude, geoLng: pos.coords.longitude, isTagged: true };
      await saveCustomer(updated);
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      alert("Location Tagged!");
    } catch (e) {
      alert("GPS Error");
    }
    setLoading(false);
  };

  const captureNewCustomerLocation = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      setNewCustLat(pos.coords.latitude);
      setNewCustLng(pos.coords.longitude);
    } catch (e) {
      alert("Could not fetch GPS. Please ensure permissions are enabled.");
    }
    setLoading(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustName || !newCustLat || !newCustLng || !attendance?.punchIn?.verifiedTerritoryId) {
      alert("Name and GPS Location are required. Please capture GPS.");
      return;
    }

    const newCustomer: Customer = {
      id: uuidv4(),
      name: newCustName,
      type: newCustType,
      category: newCustCategory,
      territoryId: attendance.punchIn.verifiedTerritoryId,
      specialty: newCustType === CustomerType.DOCTOR ? newCustSpecialty : undefined,
      email: newCustEmail,
      phone: newCustPhone,
      geoLat: newCustLat,
      geoLng: newCustLng,
      isTagged: true,
      lastMonthSales: 0
    };

    await saveCustomer(newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
    alert("Customer added to Call List!");
    setShowAddCustomer(false);

    // Reset Form
    setNewCustName('');
    setNewCustSpecialty('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewCustLat(null);
    setNewCustLng(null);
  };

  const toggleItemSelection = (itemId: string) => {
    const exists = selectedItems.find(i => i.itemId === itemId);
    if (exists) {
      setSelectedItems(prev => prev.filter(i => i.itemId !== itemId));
    } else {
      setSelectedItems(prev => [...prev, { itemId, qty: 1 }]);
    }
  };

  const updateItemQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => prev.map(i => i.itemId === itemId ? { ...i, qty } : i));
  };

  const resetForm = () => {
    setActiveCustId(null);
    setSelectedItems([]);
    setProductsDiscussed('');
    setFeedback('');
    setActionsTaken('');
  };

  const handleMarkVisit = async (customer: Customer) => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      setCurrentLoc(pos);

      // Verify Distance
      let verified = false;
      if (customer.geoLat && customer.geoLng) {
        const dist = getDistanceFromLatLonInMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          customer.geoLat,
          customer.geoLng
        );
        if (dist <= 50) verified = true;
        else {
          if (!confirm(`You are ${Math.round(dist)}m away. Marked as unverified. Continue?`)) {
            setLoading(false);
            return;
          }
        }
      }

      const jointUser = allUsers.find(u => u.uid === jointWith);

      // Map selected items to names
      const finalItems = selectedItems.map(si => {
        const stk = myStock.find(s => s.itemId === si.itemId);
        return { itemId: si.itemId, itemName: stk?.itemName || 'Item', quantity: si.qty };
      });

      const visit: VisitRecord = {
        id: uuidv4(),
        date: todayStr,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        customerId: customer.id,
        customerName: customer.name,
        territoryId: customer.territoryId,
        geoLat: pos.coords.latitude,
        geoLng: pos.coords.longitude,
        isVerifiedLocation: verified,
        jointWorkWithUid: jointWith || undefined,
        jointWorkName: jointUser?.displayName,
        productsDiscussed: productsDiscussed,
        feedback: feedback,
        actionsTaken: actionsTaken,
        itemsGiven: finalItems
      };

      await saveVisit(visit);
      setVisits(prev => [...prev, visit]);
      // Update local history immediately
      setHistoryVisits(prev => [visit, ...prev]);

      // Update local stock display
      const newStock = await getUserStock(user.uid);
      setMyStock(newStock);

      resetForm();
      alert("Visit Recorded");

    } catch (e) {
      console.error(e);
      alert("Error recording visit");
    }
    setLoading(false);
  };

  if (!attendance?.punchIn) {
    return (
      <div className="p-8 text-center bg-slate-50 border rounded text-slate-500">
        <AlertTriangle className="mx-auto mb-2 text-amber-500" />
        Please Punch In (Attendance) to start reporting visits.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-slate-800">Field Reporting</h2>
          <p className="text-xs text-slate-500">Territory: {attendance.punchIn.verifiedTerritoryName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{visits.length} / 12</div>
          <div className="text-[10px] text-slate-500">Daily Call Avg</div>
        </div>
      </div>

      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-slate-500" />
          <span className="font-medium hidden md:inline">Joint Work:</span>
          <select
            className="border rounded p-1 text-sm w-32 md:w-auto"
            value={jointWith}
            onChange={(e) => setJointWith(e.target.value)}
          >
            <option value="">-- Working Alone --</option>
            {allUsers.map(u => (
              <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          variant={showAddCustomer ? 'secondary' : 'primary'}
          onClick={() => setShowAddCustomer(!showAddCustomer)}
        >
          {showAddCustomer ? 'Cancel' : <><UserPlus size={16} className="mr-1" /> Add Customer</>}
        </Button>
      </div>

      {showAddCustomer && (
        <div className="p-4 bg-blue-50 border-b animate-in slide-in-from-top-2">
          <h3 className="font-bold text-slate-700 mb-3 flex items-center">
            <Plus size={16} className="mr-2" /> Add to Call List (Register)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
              <input className="w-full border rounded p-2 text-sm" value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="e.g. Dr. Amit Kumar" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select className="w-full border rounded p-2 text-sm" value={newCustType} onChange={e => setNewCustType(e.target.value as CustomerType)}>
                <option value={CustomerType.DOCTOR}>Doctor</option>
                <option value={CustomerType.CHEMIST}>Chemist / Pharmacy</option>
                <option value={CustomerType.STOCKIST}>Stockist</option>
              </select>
            </div>
            {newCustType === CustomerType.DOCTOR && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Specialty</label>
                <input className="w-full border rounded p-2 text-sm" value={newCustSpecialty} onChange={e => setNewCustSpecialty(e.target.value)} placeholder="e.g. Cardio" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
              <select className="w-full border rounded p-2 text-sm" value={newCustCategory} onChange={e => setNewCustCategory(e.target.value as CustomerCategory)}>
                <option value={CustomerCategory.A}>A (Core)</option>
                <option value={CustomerCategory.B}>B</option>
                <option value={CustomerCategory.C}>C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
              <input className="w-full border rounded p-2 text-sm" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="Phone Number" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
              <input className="w-full border rounded p-2 text-sm" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} placeholder="Email Address" />
            </div>

            <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-4 bg-white p-3 rounded border border-slate-200">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-600 mb-1">GPS Location (Required)</div>
                {newCustLat ? (
                  <div className="text-green-600 text-sm font-medium flex items-center">
                    <CheckCircle size={14} className="mr-1" /> Lat: {newCustLat.toFixed(4)}, Lng: {newCustLng?.toFixed(4)}
                  </div>
                ) : (
                  <div className="text-amber-500 text-xs flex items-center">
                    <AlertTriangle size={14} className="mr-1" /> Not Captured
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={captureNewCustomerLocation} disabled={loading}>
                <MapPin size={16} className="mr-1" /> Capture GPS
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateCustomer} disabled={!newCustLat}>Save to Call List</Button>
          </div>
        </div>
      )}

      <div className="divide-y">
        {customers.length === 0 && !showAddCustomer && (
          <div className="p-8 text-center text-slate-400 italic">
            No customers found in this territory. <br />
            Click "Add Customer" to build your Call List.
          </div>
        )}

        {customers.map(customer => {
          const visited = visits.find(v => v.customerId === customer.id);
          const isActive = activeCustId === customer.id;

          return (
            <div key={customer.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-800 flex items-center">
                    {customer.name}
                    <span className="ml-2 text-xs bg-slate-200 px-1 rounded text-slate-600">{customer.category}</span>
                  </div>
                  <div className="text-xs text-slate-500">{customer.specialty ? `${customer.specialty} • ` : ''}{customer.type}</div>
                  {!customer.isTagged && <div className="text-[10px] text-amber-600 mt-1">Location Not Tagged</div>}
                  {visited && (
                    <div className="mt-1 text-xs text-green-600 flex items-center"><CheckCircle size={12} className="mr-1" /> Visited at {new Date(visited.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                </div>

                <div>
                  {visited ? (
                    <Button size="sm" variant="outline" disabled>Done</Button>
                  ) : (
                    !isActive ? (
                      customer.isTagged ? (
                        <Button size="sm" onClick={() => setActiveCustId(customer.id)} disabled={loading}>
                          Visit
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleTagLocation(customer)} disabled={loading}>
                          <MapPin size={14} className="mr-1" /> Tag Loc
                        </Button>
                      )
                    ) : null
                  )}
                </div>
              </div>

              {/* Visit Entry Form */}
              {isActive && (
                <div className="mt-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">

                  {/* History Section */}
                  <div className="mb-6 bg-slate-50 rounded p-3 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                      <History size={14} className="mr-1" /> Previous Visits
                    </h4>
                    {loadingHistory ? (
                      <div className="text-xs text-slate-400">Loading history...</div>
                    ) : historyVisits.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No previous visits recorded.</div>
                    ) : (
                      <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {historyVisits.map(h => (
                          <div key={h.id} className="text-xs border-l-2 border-slate-300 pl-2 ml-1">
                            <div className="flex justify-between text-slate-500 mb-0.5">
                              <span>{new Date(h.date).toLocaleDateString()} <span className="text-[10px]">({new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span></span>
                              <span>{h.jointWorkName ? `with ${h.jointWorkName}` : 'Solo'}</span>
                            </div>
                            <div className="font-medium text-slate-800 mb-0.5">
                              {h.productsDiscussed || 'No products recorded'}
                            </div>
                            {(h.feedback || h.actionsTaken) && (
                              <div className="text-slate-600 bg-white p-1 rounded border border-slate-100 mt-1">
                                {h.feedback && <div><span className="font-semibold">Feedback:</span> {h.feedback}</div>}
                                {h.actionsTaken && <div><span className="font-semibold">Action:</span> {h.actionsTaken}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1. Products & Discussion */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center"><Box size={14} className="mr-1" /> Products Discussed</label>
                      <input
                        className="w-full border rounded p-2 text-sm"
                        placeholder="e.g. CardioPlus, OrthoFix"
                        value={productsDiscussed}
                        onChange={(e) => setProductsDiscussed(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center"><MessageSquare size={14} className="mr-1" /> Feedback / Remarks</label>
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Doctor feedback..."
                        rows={2}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center"><ListTodo size={14} className="mr-1" /> Action Taken</label>
                      <input
                        className="w-full border rounded p-2 text-sm"
                        placeholder="e.g. Requested samples next week"
                        value={actionsTaken}
                        onChange={(e) => setActionsTaken(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 2. Samples / Inventory */}
                  <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center">
                    <PackagePlus size={14} className="mr-1" /> Samples / Gifts Handed Over
                  </h4>

                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded border border-slate-100">
                    {myStock.length === 0 && <div className="text-xs italic text-slate-400">No stock available to give.</div>}
                    {myStock.map(stock => {
                      const isSelected = selectedItems.find(i => i.itemId === stock.itemId);
                      return (
                        <div key={stock.itemId} className="flex items-center justify-between text-sm">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={!!isSelected} onChange={() => toggleItemSelection(stock.itemId)} />
                            <span>{stock.itemName} <span className="text-xs text-slate-400">(Bal: {stock.quantity})</span></span>
                          </label>
                          {isSelected && (
                            <input
                              type="number"
                              min="1"
                              max={stock.quantity}
                              className="w-16 border rounded p-1 text-right bg-white"
                              value={isSelected.qty}
                              onChange={(e) => updateItemQty(stock.itemId, Number(e.target.value))}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button size="sm" onClick={() => handleMarkVisit(customer)} disabled={loading}>Confirm Visit</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
