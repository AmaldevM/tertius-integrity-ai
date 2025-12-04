import React, { useState, useEffect } from 'react';
import { CustomerCategory, SalesTarget, UserProfile } from '../types';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { getDashboardStats, getSalesTarget, getVisits } from '../services/mockDatabase';
import { getAuth } from 'firebase/auth';

export const MRAnalytics: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [target, setTarget] = useState<SalesTarget | null>(null);
  const [callTrend, setCallTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const s = await getDashboardStats(currentUser.uid);
    setStats(s);

    const now = new Date();
    const t = await getSalesTarget(currentUser.uid, now.getMonth(), now.getFullYear());
    setTarget(t);

    // Simulate last 7 days call trend (mock logic as we don't have historical aggregation ready)
    // In real app, we would query visits for last 7 days.
    // For now, we'll randomize slightly around the average.
    const trend = Array.from({ length: 7 }, () => Math.max(0, Math.round(Number(s.avgCalls) + (Math.random() * 4 - 2))));
    setCallTrend(trend);

    setLoading(false);
  };

  if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-lg"></div>;

  const targetVal = target?.targetAmount || 1;
  const achievedVal = target?.achievedAmount || 0;
  const pct = Math.round((achievedVal / targetVal) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center">
          <BarChart3 size={16} className="mr-2" /> CALL AVERAGE (LAST 7 DAYS)
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {callTrend.map((val, i) => (
            <div key={i} className="w-full bg-blue-100 rounded-t relative group">
              <div className="absolute bottom-0 w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500" style={{ height: `${Math.min(100, (val / 15) * 100)}%` }}></div>
              <span className="absolute -top-6 w-full text-center text-xs font-bold">{val}</span>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-slate-400 mt-2">Avg: {stats?.avgCalls} Calls/Day</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center">
          <TrendingUp size={16} className="mr-2" /> SALES TARGET
        </h3>
        <div className="flex flex-col items-center justify-center h-32">
          <div className="relative h-24 w-24 rounded-full border-8 border-slate-100 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-8 ${pct >= 80 ? 'border-green-500' : pct >= 50 ? 'border-blue-500' : 'border-amber-500'} border-l-transparent border-b-transparent rotate-45`}></div>
            <div className="text-center">
              <span className="block text-xl font-bold text-slate-800">{pct}%</span>
              <span className="text-[10px] text-slate-500">Achieved</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">₹{achievedVal.toLocaleString()} / ₹{targetVal.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center">
          <TrendingUp size={16} className="mr-2" /> VISIT ROI INSIGHT
        </h3>
        <p className="text-sm text-slate-600 mb-2">
          Dr. Sharma (Cat A) has received 3 visits this month but sales are down 10%.
        </p>
        <div className="bg-amber-50 p-2 rounded border border-amber-100 text-xs text-amber-800">
          Suggestion: Discuss new product range "CardioPlus" in next visit.
        </div>
      </div>

    </div>
  );
};
