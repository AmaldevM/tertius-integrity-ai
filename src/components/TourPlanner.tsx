
import React, { useState, useEffect } from 'react';
import { MonthlyTourPlan, TourPlanStatus, UserProfile, UserRole, Territory } from '../types';
import { getTourPlan, saveTourPlan, getAllUsers } from '../services/mockDatabase';
import { Button } from './Button';
import { getMonthName } from '../utils';
import { Calendar, Save, CheckCircle, Lock, Users, MapPin, X } from 'lucide-react';
import { optimizeRoute } from '../services/routeOptimizer';
import { getCustomersByTerritory } from '../services/mockDatabase';
import { Customer } from '../types';

interface TourPlannerProps {
  user: UserProfile;
  canApprove: boolean; // if Admin/ASM viewing subordinate
}

export const TourPlanner: React.FC<TourPlannerProps> = ({ user, canApprove }) => {
  const [plan, setPlan] = useState<MonthlyTourPlan | null>(null);
  const [nextMonth, setNextMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [suggestedRoute, setSuggestedRoute] = useState<{ date: string, customers: Customer[] } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Handle year rollover
  if (nextMonth.month > 11) {
    setNextMonth({ month: 0, year: nextMonth.year + 1 });
  }

  useEffect(() => {
    loadPlan();
    getAllUsers().then(setAllUsers);
  }, [user.uid]);

  const loadPlan = async () => {
    const p = await getTourPlan(user.uid, nextMonth.year, nextMonth.month);
    setPlan(p);
  };

  const updateEntry = (index: number, field: string, value: any) => {
    if (!plan || plan.status === TourPlanStatus.APPROVED) return;

    const newEntries = [...plan.entries];
    const entry = { ...newEntries[index] };

    if (field === 'territoryId') {
      const t = user.territories.find(ter => ter.id === value);
      entry.territoryId = value;
      entry.territoryName = t ? t.name : '';
    } else {
      (entry as any)[field] = value;
    }

    newEntries[index] = entry;
    setPlan({ ...plan, entries: newEntries });
  };

  const handleSave = async () => {
    if (plan) {
      await saveTourPlan(plan);
      alert('Draft saved.');
    }
  };

  const handleSubmit = async () => {
    if (plan) {
      await saveTourPlan({ ...plan, status: TourPlanStatus.SUBMITTED });
      setPlan({ ...plan, status: TourPlanStatus.SUBMITTED });
      alert('Plan submitted for approval.');
    }
  };

  const handleApprove = async () => {
    if (plan && canApprove) {
      await saveTourPlan({ ...plan, status: TourPlanStatus.APPROVED });
      setPlan({ ...plan, status: TourPlanStatus.APPROVED });
      alert('Plan Approved.');
    }
  };

  const handleSuggestRoute = async (date: string, territoryId: string) => {
    if (!territoryId) return;
    setLoadingRoute(true);
    try {
      const customers = await getCustomersByTerritory(territoryId);
      // Mock start location (User's HQ or default)
      const startLoc = { lat: user.hqLat || 28.6139, lng: user.hqLng || 77.2090 };
      const optimized = optimizeRoute(customers, startLoc);
      setSuggestedRoute({ date, customers: optimized });
    } catch (e) {
      console.error(e);
      alert("Failed to generate route.");
    } finally {
      setLoadingRoute(false);
    }
  };

  if (!plan) return <div>Loading...</div>;

  const isEditable = plan.status === TourPlanStatus.DRAFT || plan.status === TourPlanStatus.REJECTED;
  const showJointWork = canApprove || user.role !== UserRole.MR;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Calendar className="mr-2 text-blue-600" />
            Tour Plan: {getMonthName(nextMonth.month)} {nextMonth.year}
          </h2>
          <p className="text-sm text-slate-500">Plan your visits for next month.</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center
             ${plan.status === TourPlanStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
           `}>
            {plan.status}
          </span>
          {isEditable && (
            <>
              <Button size="sm" variant="outline" onClick={handleSave}><Save size={16} className="mr-1" /> Save Draft</Button>
              <Button size="sm" onClick={handleSubmit}>Submit</Button>
            </>
          )}
          {canApprove && plan.status === TourPlanStatus.SUBMITTED && (
            <Button size="sm" variant="success" onClick={handleApprove}><CheckCircle size={16} className="mr-1" /> Approve Plan</Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Day</th>
              <th className="p-3">Activity Type</th>
              <th className="p-3">Territory</th>
              {showJointWork && <th className="p-3">Joint Work</th>}
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {plan.entries.map((entry, idx) => {
              const date = new Date(entry.date);
              const isSunday = date.getDay() === 0;
              return (
                <tr key={entry.date} className={isSunday ? 'bg-slate-50' : ''}>
                  <td className="p-2 whitespace-nowrap">{date.getDate()}</td>
                  <td className="p-2 whitespace-nowrap text-slate-500">{date.toLocaleDateString(undefined, { weekday: 'short' })}</td>
                  <td className="p-2">
                    {isEditable ? (
                      <select
                        className="border rounded p-1"
                        value={entry.activityType}
                        onChange={(e) => updateEntry(idx, 'activityType', e.target.value)}
                      >
                        <option value="FIELD_WORK">Field Work</option>
                        <option value="MEETING">Meeting</option>
                        <option value="LEAVE">Leave</option>
                        <option value="HOLIDAY">Holiday</option>
                        <option value="ADMIN_DAY">Admin Day</option>
                      </select>
                    ) : entry.activityType}
                  </td>
                  <td className="p-2">
                    {entry.activityType === 'FIELD_WORK' && (
                      isEditable ? (
                        <select
                          className="border rounded p-1 w-40"
                          value={entry.territoryId || ''}
                          onChange={(e) => updateEntry(idx, 'territoryId', e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          {user.territories.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      ) : entry.territoryName
                    )}
                  </td>
                  {showJointWork && (
                    <td className="p-2">
                      {entry.activityType === 'FIELD_WORK' && (
                        isEditable ? (
                          <select
                            className="border rounded p-1 w-32"
                            value={entry.jointWorkWithUid || ''}
                            onChange={(e) => updateEntry(idx, 'jointWorkWithUid', e.target.value)}
                          >
                            <option value="">None</option>
                            {allUsers.filter(u => u.uid !== user.uid).map(u => (
                              <option key={u.uid} value={u.uid}>{u.displayName}</option>
                            ))}
                          </select>
                        ) : (
                          allUsers.find(u => u.uid === entry.jointWorkWithUid)?.displayName || '-'
                        )
                      )}
                    </td>
                  )}
                  <td className="p-2">
                    {isEditable ? (
                      <input
                        className="border rounded p-1 w-full"
                        value={entry.notes || ''}
                        onChange={(e) => updateEntry(idx, 'notes', e.target.value)}
                      />
                    ) : entry.notes}
                  </td>
                  <td className="p-2">
                    {entry.territoryId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Get Smart Route"
                        onClick={() => handleSuggestRoute(entry.date, entry.territoryId!)}
                      >
                        <MapPin size={16} className="text-indigo-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {suggestedRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <MapPin className="mr-2 text-indigo-600" />
                Smart Route Suggestion
              </h3>
              <button onClick={() => setSuggestedRoute(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Optimized sequence for {new Date(suggestedRoute.date).toLocaleDateString()}:
            </p>

            {suggestedRoute.customers.length === 0 ? (
              <p className="text-slate-500 italic">No customers found with location data in this territory.</p>
            ) : (
              <div className="space-y-3">
                {suggestedRoute.customers.map((c, i) => (
                  <div key={c.id} className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-500">
                        {c.type} • Cat {c.category} • {c.specialty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSuggestedRoute(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
