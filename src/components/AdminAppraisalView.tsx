import React, { useState, useEffect } from 'react';
import { UserProfile, AppraisalRecord, PerformanceMetrics } from '../types';
import { getAllUsers, getAppraisals, saveAppraisal, calculatePerformanceMetrics } from '../services/mockDatabase';
import { Button } from './Button';
import { getMonthName } from '../utils';
import { Search, Star, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const AdminAppraisalView: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getAllUsers().then(setUsers);
    }, []);

    const handleSelectUser = async (user: UserProfile) => {
        setSelectedUser(user);
        setLoading(true);
        const now = new Date();
        // Calculate metrics for previous month (usually appraisals are for past month)
        const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        const m = await calculatePerformanceMetrics(user.uid, month, year);
        setMetrics(m);
        setRating(0);
        setComments('');
        setLoading(false);
    };

    const handleSubmitAppraisal = async () => {
        if (!selectedUser || !metrics) return;

        const now = new Date();
        const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        // Calculate Final Score (Weighted)
        // Sales 40%, Calls 30%, Attendance 20%, Compliance 10%
        // Normalize each to 100 first
        const salesScore = Math.min((metrics.salesAchieved / metrics.salesTarget) * 100, 120); // Cap at 120%
        const callScore = Math.min((metrics.callAverage / 10) * 100, 120);
        const attScore = Math.min((metrics.attendanceDays / 24) * 100, 100);
        const compScore = metrics.tourCompliance;

        // Base score from data (max 80 points)
        const dataScore = (salesScore * 0.4) + (callScore * 0.3) + (attScore * 0.2) + (compScore * 0.1);

        // Rating score (max 20 points) -> Rating 5 = 20 pts
        const ratingScore = (rating / 5) * 20;

        const finalScore = Math.round(dataScore * 0.8 + ratingScore); // Adjusting weight logic slightly

        const record: AppraisalRecord = {
            id: uuidv4(),
            userId: selectedUser.uid,
            month,
            year,
            metrics,
            adminRating: rating,
            comments,
            finalScore,
            createdAt: new Date().toISOString()
        };

        await saveAppraisal(record);
        alert(`Appraisal submitted for ${selectedUser.displayName}. Score: ${finalScore}/100`);
        setSelectedUser(null);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Staff Performance Appraisal</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User List */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="space-y-2">
                        {users.map(u => (
                            <div
                                key={u.uid}
                                onClick={() => handleSelectUser(u)}
                                className={`p-3 rounded cursor-pointer flex items-center justify-between hover:bg-slate-50 ${selectedUser?.uid === u.uid ? 'bg-indigo-50 border-indigo-200 border' : 'border border-transparent'}`}
                            >
                                <div>
                                    <div className="font-medium text-slate-800">{u.displayName}</div>
                                    <div className="text-xs text-slate-500">{u.role} • {u.hqLocation}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Appraisal Form */}
                <div className="md:col-span-2">
                    {selectedUser && metrics ? (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedUser.displayName}</h3>
                                    <p className="text-slate-500 text-sm">Appraisal for Last Month</p>
                                </div>
                                <button onClick={() => setSelectedUser(null)}><X size={20} className="text-slate-400" /></button>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase">Sales</div>
                                    <div className="font-bold text-lg">₹{metrics.salesAchieved.toLocaleString()}</div>
                                    <div className="text-xs text-slate-400">Target: ₹{metrics.salesTarget.toLocaleString()}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase">Calls/Day</div>
                                    <div className="font-bold text-lg">{metrics.callAverage}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase">Attendance</div>
                                    <div className="font-bold text-lg">{metrics.attendanceDays} Days</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase">Compliance</div>
                                    <div className="font-bold text-lg">{metrics.tourCompliance}%</div>
                                </div>
                            </div>

                            {/* Rating Section */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Admin Rating (1-5)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`p-2 rounded-full transition-colors ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                                        >
                                            <Star size={28} fill={rating >= star ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Feedback / Comments</label>
                                <textarea
                                    className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Enter qualitative feedback..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSubmitAppraisal} disabled={rating === 0}>
                                    <Save size={18} className="mr-2" />
                                    Submit Appraisal
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 h-full flex items-center justify-center text-slate-400">
                            Select a staff member to start appraisal
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
