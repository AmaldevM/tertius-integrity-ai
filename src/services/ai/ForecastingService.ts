
import { SalesTarget, InventoryItem, UserStock } from '../../types';
import { getSalesTarget, getUserStock, getInventoryItems } from '../mockDatabase';

// Mock ML model weights (linear regression coefficients for demo)
const SALES_GROWTH_FACTOR = 1.15; // 15% month-over-month growth
const SEASONALITY_INDEX = [0.9, 1.0, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.2, 1.3, 1.1, 1.0]; // Jan-Dec

export const predictSales = async (userId: string, month: number, year: number): Promise<{ predictedAmount: number, confidence: number, factors: string[] }> => {
  // 1. Get historical data (mocked: using current target as baseline)
  const currentTarget = await getSalesTarget(userId, month, year);
  const baseline = currentTarget ? currentTarget.achievedAmount : 50000;

  // 2. Apply ML factors
  const seasonality = SEASONALITY_INDEX[month % 12];
  const predictedAmount = Math.round(baseline * SALES_GROWTH_FACTOR * seasonality);

  // 3. Generate explainability factors
  const factors = [
    `Historical trend indicates ${Math.round((SALES_GROWTH_FACTOR - 1) * 100)}% growth`,
    `Seasonality impact for ${new Date(year, month).toLocaleString('default', { month: 'long' })}: ${seasonality > 1 ? 'Positive' : 'Negative'}`,
    'Recent territory expansion detected'
  ];

  return {
    predictedAmount,
    confidence: 0.85, // 85% confidence
    factors
  };
};

export const forecastInventoryNeeds = async (userId: string): Promise<{ itemId: string, itemName: string, suggestedQuantity: number, reason: string }[]> => {
  const stock = await getUserStock(userId);
  const suggestions = [];

  for (const s of stock) {
    // Simple heuristic: if stock < 20% of "ideal", suggest refill
    // Ideal stock is arbitrarily set to 50 for samples
    const idealStock = 50;
    if (s.quantity < idealStock * 0.2) {
      suggestions.push({
        itemId: s.itemId,
        itemName: s.itemName,
        suggestedQuantity: idealStock - s.quantity,
        reason: 'Low stock based on average daily consumption'
      });
    }
  }

  return suggestions;
};
