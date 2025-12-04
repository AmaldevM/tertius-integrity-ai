
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Customer, CustomerType, CustomerCategory } from '../types';
import { getAllUsers, getAllCustomers, getAllVisits, saveCustomer, getAllAttendance } from '../services/mockDatabase';
import { Button } from './Button';
import { Download, Plus, MapPin, Database, FileSpreadsheet, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ClientManagement: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedMrId, setSelectedMrId] = useState('');
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // New Client Form
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomerType>(CustomerType.DOCTOR);
  const [category, setCategory] = useState<CustomerCategory>(CustomerCategory.C);
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [selectedMrId, selectedTerritoryId, customers]);

  const loadData = async () => {
    const u = await getAllUsers();
    setUsers(u.filter(user => user.role === UserRole.MR));
    const c = await getAllCustomers();
    setCustomers(c);
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (selectedMrId) {
      // Get territories of this MR
      const mr = users.find(u => u.uid === selectedMrId);
      if (mr) {
        const tIds = mr.territories.map(t => t.id);
        filtered = filtered.filter(c => tIds.includes(c.territoryId));
      }
    }

    if (selectedTerritoryId) {
      filtered = filtered.filter(c => c.territoryId === selectedTerritoryId);
    }

    setFilteredCustomers(filtered);
  };

  const handleSaveClient = async () => {
    if (!selectedTerritoryId) {
      alert("Please select a Territory first.");
      return;
    }
    if (!name || !lat || !lng) {
      alert("Name, Latitude, and Longitude are required.");
      return;
    }

    const newClient: Customer = {
      id: uuidv4(),
      name,
      type,
      category,
      territoryId: selectedTerritoryId,
      specialty: type === CustomerType.DOCTOR ? specialty : undefined,
      email,
      phone,
      geoLat: parseFloat(lat),
      geoLng: parseFloat(lng),
      isTagged: true,
      lastMonthSales: 0
    };

    await saveCustomer(newClient);
    setCustomers(prev => [...prev, newClient]);
    alert("Client Added Successfully!");

    // Clear Form
    setName('');
    setLat('');
    setLng('');
    setPhone('');
    setEmail('');
    setSpecialty('');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r\n|\n/);
        if (lines.length < 2) {
          alert("CSV file is empty or missing headers.");
          return;
        }

        // Flexible header matching
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

        const getIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

        const idxName = getIndex(['name', 'client name']);
        const idxType = getIndex(['type']);
        const idxCat = getIndex(['category']);
        const idxSpec = getIndex(['specialty']);
        const idxTid = getIndex(['territory', 'territory id', 'tid']);
        const idxLat = getIndex(['lat', 'latitude']);
        const idxLng = getIndex(['lng', 'longitude']);
        const idxEmail = getIndex(['email']);
        const idxPhone = getIndex(['phone']);

        if (idxName === -1 || idxTid === -1 || idxLat === -1 || idxLng === -1) {
          alert("CSV Error: Missing required columns (Name, Territory ID, Lat, Lng).");
          return;
        }

        let addedCount = 0;
        let errorCount = 0;
        const newCustomers: Customer[] = [];

        // Fetch latest users to validate territories
        const allUsers = await getAllUsers();
        const allTerritoryIds = new Set<string>();
        allUsers.forEach(u => u.territories.forEach(t => allTerritoryIds.add(t.id)));

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

          // Helper to safely get value
          const getVal = (idx: number) => idx > -1 && idx < cols.length ? cols[idx] : '';

          const nameVal = getVal(idxName);
          const tidVal = getVal(idxTid);
          const latVal = parseFloat(getVal(idxLat));
          const lngVal = parseFloat(getVal(idxLng));

          // Validation
          if (!nameVal || !tidVal || isNaN(latVal) || isNaN(lngVal)) {
            console.warn(`Row ${i + 1}: Missing required fields or invalid coordinates.`);
            errorCount++;
            continue;
          }

          if (!allTerritoryIds.has(tidVal)) {
            console.warn(`Row ${i + 1}: Invalid Territory ID '${tidVal}'.`);
            errorCount++;
            continue;
          }

          const typeVal = getVal(idxType).toUpperCase();
          const validType = (Object.values(CustomerType) as string[]).includes(typeVal) ? typeVal as CustomerType : CustomerType.DOCTOR;

          const catVal = getVal(idxCat).toUpperCase();
          const validCat = (Object.values(CustomerCategory) as string[]).includes(catVal) ? catVal as CustomerCategory : CustomerCategory.C;

          const customer: Customer = {
            id: uuidv4(),
            name: nameVal,
            type: validType,
            category: validCat,
            territoryId: tidVal,
            specialty: getVal(idxSpec),
            email: getVal(idxEmail),
            phone: getVal(idxPhone),
            geoLat: latVal,
            geoLng: lngVal,
            isTagged: true,
            lastMonthSales: 0
          };

          newCustomers.push(customer);
          addedCount++;
        }

        if (addedCount > 0) {
          for (const c of newCustomers) {
            await saveCustomer(c);
          }
          setCustomers(prev => [...prev, ...newCustomers]);
          alert(`Import Complete!\nAdded: ${addedCount}\nErrors/Skipped: ${errorCount}`);
        } else {
          alert(`Import Failed. No valid rows found.\nErrors: ${errorCount}`);
        }

      } catch (err) {
        console.error(err);
        alert("Error parsing CSV file. Please check format.");
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClients = async () => {
    // Header
    let csv = 'Client ID,Name,Type,Category,Specialty,Territory ID,Lat,Lng,Last Month Sales,Email,Phone\n';

    // Rows
    const all = await getAllCustomers();
    all.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.type}","${c.category}","${c.specialty || ''}","${c.territoryId}","${c.geoLat || ''}","${c.geoLng || ''}","${c.lastMonthSales}","${c.email || ''}","${c.phone || ''}"\n`;
    });

    downloadCSV(csv, `Client_Database_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportVisits = async () => {
    const allVisits = await getAllVisits();
    const allUsersList = await getAllUsers();

    let csv = 'Visit ID,Date,Time,MR Name,Customer Name,Type,Territory ID,Verified Loc,Products Discussed,Feedback,Actions Taken\n';

    allVisits.forEach(v => {
      const mr = allUsersList.find(u => u.uid === v.userId);
      const mrName = mr ? mr.displayName : v.userId;

      csv += `"${v.id}","${v.date}","${new Date(v.timestamp).toLocaleTimeString()}","${mrName}","${v.customerName}","${''}","${v.territoryId}","${v.isVerifiedLocation}","${v.productsDiscussed || ''}","${v.feedback || ''}","${v.actionsTaken || ''}"\n`;
    });

    downloadCSV(csv, `Visit_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportAttendance = async () => {
    const allAttendance = await getAllAttendance();
    const allUsersList = await getAllUsers();
    const allVisits = await getAllVisits();

    let csv = 'Date,User Name,Punch In,Punch Out,Total Visits\n';

    // Sort by date desc
    allAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    allAttendance.forEach(a => {
      const user = allUsersList.find(u => u.uid === a.userId);
      const userName = user ? user.displayName : a.userId;

      const punchInTime = a.punchIn ? new Date(a.punchIn.timestamp).toLocaleTimeString() : '-';
      const punchOutTime = a.punchOuts && a.punchOuts.length > 0
        ? new Date(a.punchOuts[a.punchOuts.length - 1].timestamp).toLocaleTimeString()
        : '-';

      // Count visits for this user on this date
      const visitCount = allVisits.filter(v => v.userId === a.userId && v.date === a.date).length;

      csv += `"${a.date}","${userName}","${punchInTime}","${punchOutTime}","${visitCount}"\n`;
    });

    downloadCSV(csv, `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const selectedMr = users.find(u => u.uid === selectedMrId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Database className="mr-2 text-blue-600" /> Client Master Data
          </h2>
          <p className="text-sm text-slate-500">Manage Doctors & Pharmacies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportClick}>
            <Upload size={16} className="mr-2" /> Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportClients}>
            <FileSpreadsheet size={16} className="mr-2" /> Export Clients
          </Button>
          <Button variant="outline" onClick={handleExportVisits}>
            <Download size={16} className="mr-2" /> Export Visit Reports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ADD NEW CLIENT FORM */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center border-b pb-2">
            <Plus size={16} className="mr-2" /> Add New Client
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">1. Select MR</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedMrId}
                onChange={e => { setSelectedMrId(e.target.value); setSelectedTerritoryId(''); }}
              >
                <option value="">-- Select MR --</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{u.displayName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">2. Select Territory</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedTerritoryId}
                onChange={e => setSelectedTerritoryId(e.target.value)}
                disabled={!selectedMrId}
              >
                <option value="">-- Select Territory --</option>
                {selectedMr?.territories.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Client Name</label>
              <input className="w-full border rounded p-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Ramesh" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                <select className="w-full border rounded p-2 text-sm" value={type} onChange={e => setType(e.target.value as CustomerType)}>
                  <option value={CustomerType.DOCTOR}>Doctor</option>
                  <option value={CustomerType.CHEMIST}>Chemist</option>
                  <option value={CustomerType.STOCKIST}>Stockist</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                <select className="w-full border rounded p-2 text-sm" value={category} onChange={e => setCategory(e.target.value as CustomerCategory)}>
                  <option value={CustomerCategory.A}>A</option>
                  <option value={CustomerCategory.B}>B</option>
                  <option value={CustomerCategory.C}>C</option>
                </select>
              </div>
            </div>

            {type === CustomerType.DOCTOR && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Specialty</label>
                <input className="w-full border rounded p-2 text-sm" value={specialty} onChange={e => setSpecialty(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude</label>
                <input type="number" step="0.000001" className="w-full border rounded p-2 text-sm" value={lat} onChange={e => setLat(e.target.value)} placeholder="28.1234" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude</label>
                <input type="number" step="0.000001" className="w-full border rounded p-2 text-sm" value={lng} onChange={e => setLng(e.target.value)} placeholder="77.5678" />
              </div>
            </div>

            <Button className="w-full" onClick={handleSaveClient} disabled={!selectedTerritoryId}>
              Add Client
            </Button>
          </div>
        </div>

        {/* CLIENT LIST */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b bg-slate-50 font-semibold text-slate-700">
            Registered Clients {selectedMrId ? `under ${selectedMr?.displayName}` : '(All)'}
          </div>

          <div className="overflow-auto flex-1 p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Territory ID</th>
                  <th className="p-3 text-right">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">No clients found matching filters.</td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.specialty} {c.category ? `(Cat ${c.category})` : ''}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{c.type}</span>
                      </td>
                      <td className="p-3 text-slate-500 text-xs">{c.territoryId}</td>
                      <td className="p-3 text-right text-xs text-slate-500">
                        {c.geoLat ? (
                          <span className="flex items-center justify-end text-green-600 gap-1"><MapPin size={12} /> {c.geoLat.toFixed(4)}, {c.geoLng?.toFixed(4)}</span>
                        ) : (
                          <span className="text-amber-500">No GPS</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
