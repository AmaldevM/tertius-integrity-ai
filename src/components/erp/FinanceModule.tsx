import React, { useState, useEffect } from 'react';
import { TerritoryBudget } from '../../types';
import { PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { getTerritoryBudgets } from '../../services/mockDatabase';

export const FinanceModule: React.FC = () => {
    const [budgets, setBudgets] = useState<TerritoryBudget[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadBudgets();
    }, []);

    const loadBudgets = async () => {
        setLoading(true);
        const now = new Date();
        const data = await getTerritoryBudgets(now.getMonth(), now.getFullYear());
        setBudgets(data);
        setLoading(false);
    };

    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const remaining = totalAllocated - totalSpent;

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Finance & Budgeting</h2>

            {loading ? (
                <div className="text-center py-8 text-slate-500">Loading Financial Data...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Total Budget (Current Month)</p>
                                    <p className="text-2xl font-bold">₹{totalAllocated.toLocaleString()}</p>
                                </div>
                                <DollarSign className="text-blue-500 h-8 w-8" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Total Spent</p>
                                    <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
                                </div>
                                <TrendingUp className="text-green-500 h-8 w-8" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Remaining</p>
                                    <p className="text-2xl font-bold">₹{remaining.toLocaleString()}</p>
                                </div>
                                <PieChart className="text-purple-500 h-8 w-8" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold">Territory Budget Utilization</h3>
                        </div>
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Territory</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Allocated</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Spent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utilization</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {budgets.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">No active territories found.</td></tr>
                                ) : (
                                    budgets.map(b => {
                                        const util = b.allocatedAmount > 0 ? (b.spentAmount / b.allocatedAmount) * 100 : 0;
                                        return (
                                            <tr key={b.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{b.territoryId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{b.allocatedAmount.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{b.spentAmount.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                                                        <div
                                                            className={`h-2.5 rounded-full ${util > 90 ? 'bg-red-600' : util > 75 ? 'bg-yellow-500' : 'bg-green-600'}`}
                                                            style={{ width: `${Math.min(util, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-slate-500 mt-1">{Math.round(util)}%</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
