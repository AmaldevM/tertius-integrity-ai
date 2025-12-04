
import React, { useEffect, useMemo, useState } from 'react';
import { 
  ExpenseEntry, 
  ExpenseCategory, 
  Rates, 
  CATEGORY_LABELS, 
  MonthlyExpenseSheet,
  ExpenseStatus,
  UserRole,
  Territory,
  UserStatus
} from '../types';
import { Save, AlertTriangle, CheckCircle, Lock, Printer, Camera, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface ExpenseTableProps {
  sheet: MonthlyExpenseSheet;
  rates: Rates;
  userRole: UserRole; 
  userStatus: UserStatus;
  isOwner: boolean; 
  territories: Territory[];
  onSave: (updatedEntries: ExpenseEntry[]) => void;
  onSubmit: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  sheet,
  rates,
  userRole,
  userStatus,
  isOwner,
  territories,
  onSave,
  onSubmit,
  onApprove,
  onReject
}) => {
  const [entries, setEntries] = useState<ExpenseEntry[]>(sheet.entries);
  const [isDirty, setIsDirty] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [scanningRowId, setScanningRowId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(sheet.entries);
    setIsDirty(false);
  }, [sheet.entries]);

  const isEditable = useMemo(() => {
    if (userRole === UserRole.ADMIN) return true; 
    if (sheet.status !== ExpenseStatus.DRAFT && sheet.status !== ExpenseStatus.REJECTED) return false;
    return isOwner;
  }, [userRole, sheet.status, isOwner]);

  // Derive the specific rate config for this user
  const currentRateConfig = useMemo(() => {
     // Look up key like "MR_TRAINEE" or "ASM_CONFIRMED"
     // Fallback to "MR_CONFIRMED" if specific key not found to prevent crash
     const key = `${userRole}_${userStatus}`;
     return rates[key] || rates['MR_CONFIRMED'] || { hqAllowance:0, exHqAllowance:0, outstationAllowance:0, kmRate:0 };
  }, [rates, userRole, userStatus]);

  const recalculateRow = (entry: ExpenseEntry): ExpenseEntry => {
    let allowance = 0;

    switch (entry.category) {
      case ExpenseCategory.HQ: allowance = currentRateConfig.hqAllowance; break;
      case ExpenseCategory.EX_HQ: allowance = currentRateConfig.exHqAllowance; break;
      case ExpenseCategory.OUTSTATION: allowance = currentRateConfig.outstationAllowance; break;
      case ExpenseCategory.HOLIDAY:
      case ExpenseCategory.SUNDAY: allowance = 0; break;
    }

    // Travel Amount
    let travelAmt = 0;
    if (entry.category === ExpenseCategory.OUTSTATION) {
      travelAmt = Number(entry.trainFare) || 0;
    } else {
      travelAmt = (Number(entry.km) || 0) * currentRateConfig.kmRate;
    }

    return {
      ...entry,
      dailyAllowance: allowance,
      travelAmount: travelAmt,
      totalAmount: allowance + travelAmt + (Number(entry.miscAmount) || 0)
    };
  };

  const handleTerritoryChange = (id: string, territoryId: string) => {
    if (!isEditable) return;
    
    const t = territories.find(ter => ter.id === territoryId);
    
    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;

      let updated = { ...entry };

      if (t) {
        updated.territoryId = t.id;
        updated.towns = t.name;
        updated.category = t.category;
        
        if (t.category === ExpenseCategory.OUTSTATION) {
          updated.km = 0; 
        } else {
          updated.km = t.fixedKm; // Use Admin defined Fixed KM
          updated.trainFare = 0; 
        }
      } else {
        updated.territoryId = undefined;
        updated.towns = '';
      }

      return recalculateRow(updated);
    }));
    setIsDirty(true);
  };

  const handleEntryChange = (id: string, field: keyof ExpenseEntry, value: any) => {
    if (!isEditable) return;

    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const updated = { ...entry, [field]: value };
      
      if (field === 'category') {
        if (value === ExpenseCategory.OUTSTATION) {
           updated.km = 0;
        } else {
           updated.trainFare = 0;
           if ([ExpenseCategory.HQ, ExpenseCategory.HOLIDAY, ExpenseCategory.SUNDAY].includes(value)) {
             updated.km = 0;
           }
        }
      }

      return recalculateRow(updated);
    }));
    setIsDirty(true);
  };

  // Mock AI Receipt Scanning
  const handleSmartScan = (id: string) => {
    setScanningRowId(id);
    setTimeout(() => {
      const mockAmount = Math.floor(Math.random() * 400) + 50;
      const mockItems = ['Lunch', 'Stationery', 'Toll Charge', 'Parking'];
      const mockItem = mockItems[Math.floor(Math.random() * mockItems.length)];
      
      handleEntryChange(id, 'miscAmount', mockAmount);
      handleEntryChange(id, 'remarks', `${mockItem} (AI Scanned)`);
      setScanningRowId(null);
      alert(`AI Scanned Receipt!\nDetected: ${mockItem}\nAmount: ₹${mockAmount}`);
    }, 1500);
  };

  const totals = useMemo(() => {
    return entries.reduce((acc, curr) => ({
      allowance: acc.allowance + curr.dailyAllowance,
      travel: acc.travel + curr.travelAmount,
      misc: acc.misc + curr.miscAmount,
      km: acc.km + curr.km,
      total: acc.total + curr.totalAmount,
      hqDays: acc.hqDays + (curr.category === ExpenseCategory.HQ ? 1 : 0)
    }), { allowance: 0, travel: 0, misc: 0, km: 0, total: 0, hqDays: 0 });
  }, [entries]);

  const hqWarning = totals.hqDays < 8;

  const handleSave = () => {
    onSave(entries);
    setIsDirty(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-white z-10 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
             {new Date(sheet.year, sheet.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2 text-sm mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
              ${sheet.status === ExpenseStatus.APPROVED_ADMIN ? 'bg-green-100 text-green-700' : 
                sheet.status === ExpenseStatus.REJECTED ? 'bg-red-100 text-red-700' : 
                'bg-blue-100 text-blue-700'}`}>
              {sheet.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} size="sm" variant="secondary">
             <Printer size={16} className="mr-2" /> Print / PDF
          </Button>

          {isEditable && isDirty && (
            <Button onClick={handleSave} size="sm" variant="outline">
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          )}

          {isOwner && (sheet.status === ExpenseStatus.DRAFT || sheet.status === ExpenseStatus.REJECTED) && (
            <Button onClick={onSubmit} size="sm">Submit for Approval</Button>
          )}

          {!isOwner && userRole !== UserRole.MR && (
             (userRole === UserRole.ASM && sheet.status === ExpenseStatus.SUBMITTED) ||
             (userRole === UserRole.ADMIN && [ExpenseStatus.SUBMITTED, ExpenseStatus.APPROVED_ASM].includes(sheet.status))
          ) && (
            <>
              {showRejectInput ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Reason..." 
                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <Button size="sm" variant="danger" onClick={() => onReject && onReject(rejectReason)}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>X</Button>
                </div>
              ) : (
                <>
                  <Button size="sm" variant="danger" onClick={() => setShowRejectInput(true)}>Reject</Button>
                  <Button size="sm" variant="success" onClick={onApprove}>
                    <CheckCircle size={16} className="mr-2" /> Approve
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden print-only mb-4 border-b pb-2">
        <h1 className="text-xl font-bold">Expense Sheet</h1>
        <p>Period: {new Date(sheet.year, sheet.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        <p>Status: {sheet.status}</p>
      </div>

      {hqWarning && userRole === UserRole.MR && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mx-4 mt-4 text-sm text-amber-700 flex items-center no-print">
          <AlertTriangle size={16} className="mr-2" />
          <span>Warning: Only {totals.hqDays} HQ days recorded. Minimum 8 required.</span>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 custom-scrollbar print-full-width">
        <table className="w-full min-w-[900px] text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-0">
            <tr>
              <th className="p-3 border-b font-medium w-24">Date</th>
              <th className="p-3 border-b font-medium w-48">Territory / Category</th>
              <th className="p-3 border-b font-medium w-20 text-right">KM</th>
              <th className="p-3 border-b font-medium w-24 text-right">Fare (Act.)</th>
              <th className="p-3 border-b font-medium w-20 text-right">DA</th>
              <th className="p-3 border-b font-medium w-20 text-right">Travel</th>
              <th className="p-3 border-b font-medium w-28 text-right">Misc</th>
              <th className="p-3 border-b font-medium w-20 text-right">Total</th>
              <th className="p-3 border-b font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const isWeekend = entry.category === ExpenseCategory.SUNDAY;
              const rowClass = isWeekend ? 'bg-slate-50' : '';
              
              return (
                <tr key={entry.id} className={`hover:bg-blue-50/30 transition-colors ${rowClass}`}>
                  <td className="p-2 text-slate-600 font-medium whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString(undefined, { day: '2-digit', weekday: 'short' })}
                  </td>
                  <td className="p-2">
                    {isEditable ? (
                      <div className="flex flex-col gap-1">
                        <select 
                          className="w-full border-slate-200 rounded text-sm py-1 focus:ring-2 focus:ring-blue-500"
                          value={entry.territoryId || ''}
                          onChange={(e) => handleTerritoryChange(entry.id, e.target.value)}
                        >
                          <option value="">-- Select Territory --</option>
                          {territories.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                          ))}
                          <option value="custom">Custom / Other</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Cat:</span>
                          <select 
                            className="text-xs bg-slate-50 border-none py-0 pl-1"
                            value={entry.category}
                            onChange={(e) => handleEntryChange(entry.id, 'category', e.target.value)}
                          >
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.towns || '-'}</span>
                        <span className="text-xs text-slate-500">{CATEGORY_LABELS[entry.category]}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {isEditable && entry.category !== ExpenseCategory.OUTSTATION && ![ExpenseCategory.HQ, ExpenseCategory.SUNDAY, ExpenseCategory.HOLIDAY].includes(entry.category) ? (
                      <input 
                        type="number" 
                        min="0"
                        className="w-full text-right border-slate-200 rounded px-1 py-1 text-sm border"
                        value={entry.km}
                        onChange={(e) => handleEntryChange(entry.id, 'km', Number(e.target.value))}
                      />
                    ) : (
                      <span className={entry.km > 0 ? 'text-slate-800' : 'text-slate-300'}>{entry.km}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {isEditable && entry.category === ExpenseCategory.OUTSTATION ? (
                      <input 
                         type="number"
                         min="0"
                         placeholder="Fare"
                         className="w-full text-right border-blue-200 bg-blue-50 rounded px-1 py-1 text-sm border font-semibold text-blue-700"
                         value={entry.trainFare}
                         onChange={(e) => handleEntryChange(entry.id, 'trainFare', Number(e.target.value))}
                      />
                    ) : (
                      <span className={entry.trainFare > 0 ? 'text-slate-800' : 'text-slate-300'}>
                        {entry.trainFare > 0 ? `₹${entry.trainFare}` : '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right text-slate-500">{entry.dailyAllowance}</td>
                  <td className="p-2 text-right text-slate-500">{entry.travelAmount}</td>
                  <td className="p-2 text-right relative group">
                     {isEditable ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="0"
                          className="w-full text-right border-slate-200 rounded px-1 py-1 text-sm border"
                          value={entry.miscAmount}
                          onChange={(e) => handleEntryChange(entry.id, 'miscAmount', Number(e.target.value))}
                        />
                        <button 
                          onClick={() => handleSmartScan(entry.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Smart Scan Receipt (AI)"
                        >
                          {scanningRowId === entry.id ? <Sparkles size={14} className="animate-spin text-indigo-500"/> : <Camera size={14}/>}
                        </button>
                      </div>
                    ) : entry.miscAmount}
                  </td>
                  <td className="p-2 text-right font-semibold text-slate-700">{entry.totalAmount}</td>
                  <td className="p-2">
                    {isEditable ? (
                      <input 
                        type="text" 
                        className="w-full border-slate-200 rounded px-2 py-1 text-sm border"
                        value={entry.remarks}
                        onChange={(e) => handleEntryChange(entry.id, 'remarks', e.target.value)}
                      />
                    ) : entry.remarks}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 font-semibold text-slate-800 sticky bottom-0 border-t-2 border-slate-300">
            <tr>
              <td colSpan={2} className="p-3 text-right">Grand Totals:</td>
              <td className="p-3 text-right">{totals.km}</td>
              <td className="p-3 text-right">-</td>
              <td className="p-3 text-right">₹{totals.allowance}</td>
              <td className="p-3 text-right">₹{totals.travel}</td>
              <td className="p-3 text-right">₹{totals.misc}</td>
              <td className="p-3 text-right text-blue-700 text-base">₹{totals.total}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
