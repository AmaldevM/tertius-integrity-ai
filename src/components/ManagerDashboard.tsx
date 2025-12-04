
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, SalesTarget, Customer } from '../types';
import { getAllUsers, getSalesTarget, setSalesTarget, getTeamMembers, getCustomersByTerritory, updateCustomerSales, getDashboardStats } from '../services/mockDatabase';
import { getDownstreamUserIds } from '../utils';
import { Button } from './Button';
import { BarChart3, TrendingUp, DollarSign, Target, PieChart, ArrowUpRight, ArrowDownRight, CalendarRange, Clock, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ManagerDashboardProps {
  user: UserProfile;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [targets, setTargets] = useState<Record<string, SalesTarget>>({});
  const [stats, setStats] = useState<Record<string, any>>({});

  // Aggregate State
  const [totalTarget, setTotalTarget] = useState(0);
  const [totalAchieved, setTotalAchieved] = useState(0);

  // Sales Input State
  const [selectedMR, setSelectedMR] = useState('');
  const [mrCustomers, setMrCustomers] = useState<Customer[]>([]);
  const [selectedCust, setSelectedCust] = useState('');
  const [salesAmount, setSalesAmount] = useState(0);

  // Quarterly Target State
  const [targetUser, setTargetUser] = useState('');
  const [targetQuarter, setTargetQuarter] = useState('Q1');
  const [quarterAmount, setQuarterAmount] = useState(0);

  useEffect(() => {
    loadTeamData();
  }, [user.uid]);

  const loadTeamData = async () => {
    const all = await getAllUsers();
    let members: UserProfile[] = [];

    if (user.role === UserRole.ADMIN) {
      // Admin sees everyone except other Admins
      members = all.filter(u => u.role !== UserRole.ADMIN);
    } else {
      // Use the robust hierarchy helper
      const subordinateIds = getDownstreamUserIds(user.uid, all);
      members = all.filter(u => subordinateIds.includes(u.uid));
    }

    setTeam(members);

    // Load targets and stats
    const now = new Date();
    const tMap: Record<string, SalesTarget> = {};
    const statsMap: Record<string, any> = {};
    let tTarget = 0;
    let tAchieved = 0;

    for (const m of members) {
      const t = await getSalesTarget(m.uid, now.getMonth(), now.getFullYear());
      if (t) {
        tMap[m.uid] = t;
        tTarget += t.targetAmount;
        tAchieved += t.achievedAmount;
      }

      const s = await getDashboardStats(m.uid);
      statsMap[m.uid] = s;
    }
    setTargets(tMap);
    setStats(statsMap);
    setTotalTarget(tTarget);
    setTotalAchieved(tAchieved);
  };

  const handleFetchCustomers = async (mrId: string) => {
    setSelectedMR(mrId);
    const mr = team.find(u => u.uid === mrId);
    if (mr && mr.territories.length > 0) {
      const c = await getCustomersByTerritory(mr.territories[0].id);
      setMrCustomers(c);
    } else {
      setMrCustomers([]);
    }
  };

  const handleUpdateSales = async () => {
    if (!selectedCust || salesAmount < 0) return;
    await updateCustomerSales(selectedCust, salesAmount);

    const tgt = targets[selectedMR];
    if (tgt) {
      const newAchieved = tgt.achievedAmount + salesAmount;
      const updatedTgt = { ...tgt, achievedAmount: newAchieved };
      await setSalesTarget(updatedTgt);
      setTargets(prev => ({ ...prev, [selectedMR]: updatedTgt }));
    } else {
      const now = new Date();
      const newTgt = {
        id: 'new', userId: selectedMR, month: now.getMonth(), year: now.getFullYear(),
        targetAmount: 200000, achievedAmount: salesAmount
      };
      await setSalesTarget(newTgt);
      setTargets(prev => ({ ...prev, [selectedMR]: newTgt }));
    }
    setTotalAchieved(prev => prev + salesAmount);
    alert("Sales Recorded!");
    setSalesAmount(0);
  };

  const handleSetQuarterlyTarget = async () => {
    if (!targetUser || !targetQuarter || quarterAmount <= 0) return;
    const monthlyAmount = Math.floor(quarterAmount / 3);
    const year = new Date().getFullYear();
    let startMonth = 0;
    if (targetQuarter === 'Q1') startMonth = 0;
    if (targetQuarter === 'Q2') startMonth = 3;
    if (targetQuarter === 'Q3') startMonth = 6;
    if (targetQuarter === 'Q4') startMonth = 9;

    for (let i = 0; i < 3; i++) {
      const month = startMonth + i;
      const existing = await getSalesTarget(targetUser, month, year);
      const newTgt: SalesTarget = {
        id: existing ? existing.id : `tgt_${targetUser}_${month}`,
        userId: targetUser,
        month,
        year,
        targetAmount: monthlyAmount,
        achievedAmount: existing ? existing.achievedAmount : 0
      };
      await setSalesTarget(newTgt);
    }
    alert(`Target set for ${targetQuarter}!`);
    setQuarterAmount(0);
    loadTeamData();
  };

  const overallPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
  const isPositive = overallPct >= 80;

  return (
    <div className="space-y-6">

      {/* 1. Overall Trend Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6">
          <PieChart className="mr-2 text-blue-600" />
          Overall Sales & Achievement Trends
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Target</div>
            <div className="text-2xl font-bold text-slate-800">₹{(totalTarget / 100000).toFixed(1)}L</div>
            <div className="text-xs text-slate-400 mt-1">Team Aggregate</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-blue-600">₹{(totalAchieved / 100000).toFixed(1)}L</div>
            <div className="text-xs text-slate-400 mt-1">Current Month</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Achievement %</div>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-amber-600'} flex items-center`}>
              {overallPct}%
              {isPositive ? <ArrowUpRight size={20} className="ml-1" /> : <ArrowDownRight size={20} className="ml-1" />}
            </div>
            <div className="text-xs text-slate-400 mt-1">vs Target</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deficit / Gap</div>
            <div className="text-2xl font-bold text-slate-700">₹{Math.max(0, totalTarget - totalAchieved).toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">To reach 100%</div>
          </div>
        </div>

        {/* 1.5. Sales vs Target Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6">
            <BarChart3 className="mr-2 text-blue-600" />
            Team Performance Chart
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={team.map(m => ({
                  name: m.displayName.split(' ')[0],
                  Target: targets[m.uid]?.targetAmount || 0,
                  Achieved: targets[m.uid]?.achievedAmount || 0
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Target" fill="#94a3b8" />
                <Bar dataKey="Achieved" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Individual Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6">
          <TrendingUp className="mr-2 text-blue-600" />
          Individual Performance
        </h2>

        {team.length === 0 ? (
          <div className="p-4 text-center text-slate-400 italic">No team members found under your hierarchy.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Attendance</th>
                  <th className="p-3 text-center">Avg Time Worked</th>
                  <th className="p-3 text-center">Calls/Day</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Achieved</th>
                  <th className="p-3 w-1/4">Sales Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {team.map(member => {
                  const t = targets[member.uid];
                  const s = stats[member.uid] || { attendancePct: 0, avgHours: 0, avgCalls: 0 };
                  const targetVal = t?.targetAmount || 0;
                  const achievedVal = t?.achievedAmount || 0;
                  const pct = targetVal > 0 ? Math.min(100, Math.round((achievedVal / targetVal) * 100)) : 0;

                  return (
                    <tr key={member.uid} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{member.displayName}</td>
                      <td className="p-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{member.role}</span></td>

                      <td className="p-3 text-center">
                        <span className={`text-xs font-bold ${s.attendancePct >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                          {s.attendancePct}%
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs flex items-center justify-center gap-1 text-slate-600">
                        <Clock size={12} /> {s.avgHours}h
                      </td>
                      <td className="p-3 text-center text-xs">
                        <span className="flex items-center justify-center gap-1 text-slate-600">
                          <Phone size={12} /> {s.avgCalls}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500">₹{targetVal.toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-700">₹{achievedVal.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Quarterly Targets Input */}
      {(user.role === UserRole.ADMIN || user.role === UserRole.ZM || user.role === UserRole.RM) && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6 border-b pb-2">
            <CalendarRange className="mr-2 text-indigo-600" />
            Set Quarterly Targets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={targetUser}
                onChange={e => setTargetUser(e.target.value)}
              >
                <option value="">-- Select --</option>
                {team.map(t => (
                  <option key={t.uid} value={t.uid}>{t.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Quarter</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={targetQuarter}
                onChange={e => setTargetQuarter(e.target.value)}
              >
                <option value="Q1">Q1 (Jan-Mar)</option>
                <option value="Q2">Q2 (Apr-Jun)</option>
                <option value="Q3">Q3 (Jul-Sep)</option>
                <option value="Q4">Q4 (Oct-Dec)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={quarterAmount}
                onChange={e => setQuarterAmount(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleSetQuarterlyTarget} disabled={!targetUser || quarterAmount <= 0}>
              Set Target
            </Button>
          </div>
        </div>
      )}

      {/* 4. Admin Sales Input (Only Admin) */}
      {user.role === UserRole.ADMIN && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6 border-b pb-2">
            <DollarSign className="mr-2 text-green-600" />
            Record Sales Figures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select MR</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedMR}
                onChange={e => handleFetchCustomers(e.target.value)}
              >
                <option value="">-- Select MR --</option>
                {team.filter(t => t.role === UserRole.MR).map(t => (
                  <option key={t.uid} value={t.uid}>{t.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Customer</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedCust}
                onChange={e => setSelectedCust(e.target.value)}
                disabled={!selectedMR}
              >
                <option value="">-- Select --</option>
                {mrCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={salesAmount}
                onChange={e => setSalesAmount(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleUpdateSales} disabled={!selectedCust}>
              Submit Sales
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
