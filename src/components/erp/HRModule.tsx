
import React, { useState } from 'react';
import { UserProfile, LeaveApplication, LeaveType, LeaveStatus, PayrollPreview } from '../../types';
import { Button } from '../Button';
import { Calendar, DollarSign, Clock } from 'lucide-react';

import { getLeaves, saveLeave, calculatePayroll } from '../../services/mockDatabase';

interface HRModuleProps {
    user: UserProfile;
}

export const HRModule: React.FC<HRModuleProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'LEAVE' | 'PAYROLL'>('LEAVE');
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [payroll, setPayroll] = useState<PayrollPreview | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [user.uid, activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'LEAVE') {
            const data = await getLeaves(user.uid);
            setLeaves(data);
        } else {
            const now = new Date();
            const data = await calculatePayroll(user.uid, now.getMonth(), now.getFullYear());
            setPayroll(data);
        }
        setLoading(false);
    };

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        const newLeave: LeaveApplication = {
            id: Date.now().toString(),
            userId: user.uid,
            startDate: '2024-04-01', // Ideally from form state
            endDate: '2024-04-02',
            type: LeaveType.CASUAL,
            reason: 'Personal Work',
            status: LeaveStatus.PENDING,
            appliedAt: new Date().toISOString()
        };
        await saveLeave(newLeave);
        setLeaves([...leaves, newLeave]);
        setShowApplyModal(false);
        alert('Leave applied successfully!');
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Human Resources</h2>

            <div className="flex space-x-4 mb-6 border-b">
                <button
                    className={`pb-2 px-4 ${activeTab === 'LEAVE' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('LEAVE')}
                >
                    Leave Management
                </button>
                <button
                    className={`pb-2 px-4 ${activeTab === 'PAYROLL' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('PAYROLL')}
                >
                    Payroll & Compensation
                </button>
            </div>

            {loading && <div className="text-center py-8 text-slate-500">Loading HR Data...</div>}

            {!loading && activeTab === 'LEAVE' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">My Leaves</h3>
                        <Button onClick={() => setShowApplyModal(true)}>Apply Leave</Button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {leaves.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">No leave history found.</td></tr>
                                ) : (
                                    leaves.map(leave => (
                                        <tr key={leave.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {leave.startDate} to {leave.endDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{leave.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{leave.reason}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'PAYROLL' && payroll && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <DollarSign className="mr-2 text-green-600" /> Salary Slip Preview
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-600">Basic Salary</span>
                                <span className="font-medium">₹{payroll.basicSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-600">HRA</span>
                                <span className="font-medium">₹{payroll.hra.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-600">Allowances (Est.)</span>
                                <span className="font-medium">₹{payroll.allowances.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 text-red-500">
                                <span>Deductions (PF/Tax)</span>
                                <span>- ₹{payroll.deductions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 text-lg font-bold text-slate-800">
                                <span>Net Pay</span>
                                <span>₹{payroll.netPay.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button className="w-full" variant="outline">Download Slip</Button>
                        </div>
                    </div>
                </div>
            )}

            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Apply for Leave</h3>
                        <form onSubmit={handleApplyLeave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Leave Type</label>
                                <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2">
                                    <option>Casual Leave</option>
                                    <option>Sick Leave</option>
                                    <option>Earned Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">From</label>
                                    <input type="date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">To</label>
                                    <input type="date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Reason</label>
                                <textarea className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2" rows={3}></textarea>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="ghost" onClick={() => setShowApplyModal(false)} type="button">Cancel</Button>
                                <Button type="submit">Submit Application</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
