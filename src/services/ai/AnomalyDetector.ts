
import { MonthlyExpenseSheet, ExpenseEntry, ExpenseCategory } from '../../types';

export interface Anomaly {
    entryId: string;
    date: string;
    type: 'HIGH_COST' | 'UNUSUAL_CATEGORY' | 'DUPLICATE';
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const detectExpenseAnomalies = (sheet: MonthlyExpenseSheet): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    const entries = sheet.entries;

    // 1. Check for unusually high amounts
    const avgTotal = entries.reduce((sum, e) => sum + e.totalAmount, 0) / (entries.length || 1);
    const threshold = avgTotal * 2.5; // 2.5x average is suspicious

    entries.forEach(e => {
        if (e.totalAmount > threshold && e.totalAmount > 1000) { // Min threshold 1000
            anomalies.push({
                entryId: e.id,
                date: e.date,
                type: 'HIGH_COST',
                description: `Expense of ₹${e.totalAmount} is significantly higher than average (₹${Math.round(avgTotal)})`,
                severity: 'HIGH'
            });
        }

        // 2. Check for Sunday work without "SUNDAY" category (if applicable)
        const day = new Date(e.date).getDay();
        if (day === 0 && e.category !== ExpenseCategory.SUNDAY && e.category !== ExpenseCategory.HOLIDAY) {
            anomalies.push({
                entryId: e.id,
                date: e.date,
                type: 'UNUSUAL_CATEGORY',
                description: 'Sunday work marked as regular category',
                severity: 'MEDIUM'
            });
        }
    });

    return anomalies;
};
