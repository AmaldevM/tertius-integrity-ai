import React, { useState, useEffect } from 'react';
import { UserProfile, PerformanceMetrics, AppraisalRecord } from '../types';
import { calculatePerformanceMetrics, getAppraisals } from '../services/mockDatabase';
import { TrendingUp, Award, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { getMonthName } from '../utils';

interface PerformanceDashboardProps {
    user: UserProfile;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ user }) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [appraisal, setAppraisal] = useState<AppraisalRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user.uid]);

    const loadData = async () => {
        setLoading(true);
        const now = new Date();
        // Get metrics for current month
        const m = await calculatePerformanceMetrics(user.uid, now.getMonth(), now.getFullYear());
        setMetrics(m);

        // Get latest appraisal (mock: look for current month or last month)
        const appraisals = await getAppraisals(user.uid);
        if (appraisals.length > 0) {
            // Sort by date desc
            setAppraisal(appraisals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Performance Data...</div>;

    if (!metrics) return <div className="p-8 text-center">No data available.</div>;

    const salesPct = Math.round((metrics.salesAchieved / metrics.salesTarget) * 100);
    const projectedBonus = salesPct >= 100 ? (metrics.salesAchieved * 0.02) : 0; // 2% bonus if target hit

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <TrendingUp className="mr-2 text-indigo-600" />
                My Performance Dashboard
            </h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Sales Achievement</div>
                    <div className={`text-2xl font-bold ${salesPct >= 100 ? 'text-green-600' : 'text-slate-800'}`}>
                        {salesPct}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        ₹{metrics.salesAchieved.toLocaleString()} / ₹{metrics.salesTarget.toLocaleString()}
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className={`h-full ${salesPct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(salesPct, 100)}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Call Average</div>
                    <div className="text-2xl font-bold text-slate-800">{metrics.callAverage}</div>
                    <div className="text-xs text-slate-400 mt-1">Target: 10 calls/day</div>
                    <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className={`h-full ${metrics.callAverage >= 10 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((metrics.callAverage / 12) * 100, 100)}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Attendance</div>
                    <div className="text-2xl font-bold text-slate-800">{metrics.attendanceDays} Days</div>
                    <div className="text-xs text-slate-400 mt-1">Working Days: 24</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tour Compliance</div>
                    <div className="text-2xl font-bold text-slate-800">{metrics.tourCompliance}%</div>
                    <div className="text-xs text-slate-400 mt-1">Plan vs Actual</div>
                </div>
            </div>

            {/* AI Insight & Bonus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg p-6 text-white shadow-lg">
                    <h3 className="text-lg font-bold flex items-center mb-2">
                        <Award className="mr-2 text-yellow-300" />
                        Projected Bonus
                    </h3>
                    <div className="text-3xl font-bold mb-1">₹{projectedBonus.toLocaleString()}</div>
                    <p className="text-indigo-200 text-sm mb-4">
                        {salesPct >= 100
                            ? "Great job! You've unlocked the 2% sales incentive."
                            : `You are ₹{(metrics.salesTarget - metrics.salesAchieved).toLocaleString()} away from your target.`}
                    </p>
                    {salesPct < 100 && (
                        <div className="bg-white/10 rounded p-3 text-sm">
                            <span className="font-bold text-yellow-300">Tip:</span> Focus on your 'Category A' doctors in the next 5 days to close the gap.
                        </div>
                    )}
                </div>

                {/* Latest Appraisal Status */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold flex items-center mb-4 text-slate-800">
                        <Calendar className="mr-2 text-slate-500" />
                        Latest Appraisal
                    </h3>
                    {appraisal ? (
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm font-semibold text-slate-700">{getMonthName(appraisal.month)} {appraisal.year}</div>
                                    <div className="text-xs text-slate-500">Rated on {new Date(appraisal.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                                    Score: {appraisal.finalScore}/100
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Manager Rating</span>
                                    <span className="font-medium">{appraisal.managerRating || '-'}/5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Admin Rating</span>
                                    <span className="font-medium">{appraisal.adminRating || '-'}/5</span>
                                </div>
                                {appraisal.comments && (
                                    <div className="mt-3 bg-slate-50 p-3 rounded text-sm text-slate-600 italic">
                                        "{appraisal.comments}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <AlertCircle size={32} className="mb-2 opacity-50" />
                            <p>No appraisal records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
