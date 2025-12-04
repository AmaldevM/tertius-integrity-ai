
import React, { useState } from 'react';
import { Rates, UserRole, UserStatus, RateConfig } from '../types';
import { Button } from './Button';
import { Settings, Save, AlertCircle } from 'lucide-react';

interface AdminSettingsProps {
  currentRates: Rates;
  onSave: (rates: Rates) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ currentRates, onSave }) => {
  const [rates, setRates] = useState<Rates>(currentRates);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MR);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(UserStatus.CONFIRMED);

  const currentKey = `${selectedRole}_${selectedStatus}`;
  const config = rates[currentKey] || { hqAllowance: 0, exHqAllowance: 0, outstationAllowance: 0, kmRate: 0 };

  const handleConfigChange = (key: keyof RateConfig, value: string) => {
    const newVal = Number(value);
    setRates(prev => ({
      ...prev,
      [currentKey]: {
        ...prev[currentKey],
        [key]: newVal
      }
    }));
  };

  const roles = Object.values(UserRole).filter(r => r !== UserRole.ADMIN); // Admin doesn't need rates usually

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <Settings className="text-slate-500" />
        <h2 className="text-xl font-bold text-slate-800">Master Configuration</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Selection Panel */}
        <div className="md:col-span-1 bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-700 text-sm uppercase">Select Profile</h3>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">1. User Role</label>
            <select 
              className="w-full border rounded p-2 text-sm bg-white"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as UserRole)}
            >
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">2. Status</label>
            <select 
              className="w-full border rounded p-2 text-sm bg-white"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as UserStatus)}
            >
              <option value={UserStatus.TRAINEE}>Trainee / Probation</option>
              <option value={UserStatus.CONFIRMED}>Confirmed</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex items-start">
             <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0"/>
             Expenses for {selectedRole} ({selectedStatus}) will be calculated using the rates set on the right.
          </div>
        </div>

        {/* Input Panel */}
        <div className="md:col-span-2">
           <h3 className="font-bold text-slate-700 text-sm uppercase mb-4">
             Configure Rates for <span className="text-blue-600">{selectedRole} - {selectedStatus}</span>
           </h3>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 border-b pb-1">DAILY ALLOWANCES (DA)</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">HQ Allowance (₹)</label>
                  <input 
                    type="number" 
                    value={config.hqAllowance} 
                    onChange={(e) => handleConfigChange('hqAllowance', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ex-HQ Allowance (₹)</label>
                  <input 
                    type="number" 
                    value={config.exHqAllowance} 
                    onChange={(e) => handleConfigChange('exHqAllowance', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Outstation Allowance (₹)</label>
                  <input 
                    type="number" 
                    value={config.outstationAllowance} 
                    onChange={(e) => handleConfigChange('outstationAllowance', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 border-b pb-1">TRAVEL</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rate per KM (₹)</label>
                  <input 
                    type="number" step="0.1"
                    value={config.kmRate} 
                    onChange={(e) => handleConfigChange('kmRate', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Applied to Ex-HQ and fixed distances.
                  </p>
                </div>
              </div>
           </div>
        </div>

      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
        <Button onClick={() => onSave(rates)}>
           <Save size={16} className="mr-2"/> Save Configuration
        </Button>
      </div>
    </div>
  );
};
