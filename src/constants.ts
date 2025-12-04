

import { Rates, UserProfile, UserRole, UserStatus, ExpenseCategory, Customer, CustomerType, CustomerCategory, InventoryItem, UserStock, SalesTarget, RateConfig } from './types';

// Default configuration for new Rate Matrix
const DEFAULT_CONFIG: RateConfig = {
  hqAllowance: 291,
  exHqAllowance: 600,
  outstationAllowance: 1200,
  kmRate: 3.0,
};

// Generate default matrix for all Role+Status combinations
const generateDefaultRates = (): Rates => {
  const roles = Object.values(UserRole);
  const statuses = Object.values(UserStatus);
  const rates: Rates = {};

  roles.forEach(role => {
    statuses.forEach(status => {
      // Slightly higher rates for Confirmed vs Trainee
      const multiplier = status === UserStatus.CONFIRMED ? 1.2 : 1.0;
      // Role multiplier
      let roleMult = 1;
      if (role === UserRole.ASM) roleMult = 1.5;
      if (role === UserRole.RM) roleMult = 2;
      if (role === UserRole.ZM) roleMult = 2.5;

      rates[`${role}_${status}`] = {
        hqAllowance: Math.round(DEFAULT_CONFIG.hqAllowance * multiplier * roleMult),
        exHqAllowance: Math.round(DEFAULT_CONFIG.exHqAllowance * multiplier * roleMult),
        outstationAllowance: Math.round(DEFAULT_CONFIG.outstationAllowance * multiplier * roleMult),
        kmRate: DEFAULT_CONFIG.kmRate + (role === UserRole.MR ? 0 : 1) // Higher KM rate for seniors
      };
    });
  });
  return rates;
};

export const DEFAULT_RATES: Rates = generateDefaultRates();

export const MOCK_USERS: UserProfile[] = [
  {
    uid: 'admin1',
    email: 'admin@tertius.com',
    displayName: 'System Admin',
    role: UserRole.ADMIN,
    status: UserStatus.CONFIRMED,
    hqLocation: 'Mumbai',
    territories: []
  },
  {
    uid: 'zm1',
    email: 'zm@tertius.com',
    displayName: 'Vikram Malhotra (ZM)',
    role: UserRole.ZM,
    status: UserStatus.CONFIRMED,
    hqLocation: 'New Delhi',
    state: 'North Zone',
    territories: []
  },
  {
    uid: 'rm1',
    email: 'rm@tertius.com',
    displayName: 'Sanjay Gupta (RM)',
    role: UserRole.RM,
    status: UserStatus.CONFIRMED,
    hqLocation: 'Lucknow',
    state: 'Uttar Pradesh',
    reportingManagerId: 'zm1',
    territories: []
  },
  {
    uid: 'asm1',
    email: 'asm@tertius.com',
    displayName: 'Rajesh Sharma (ASM)',
    role: UserRole.ASM,
    status: UserStatus.CONFIRMED,
    hqLocation: 'Delhi',
    reportingManagerId: 'rm1',
    territories: [
      {
        id: 't1',
        name: 'Delhi Central (HQ)',
        category: ExpenseCategory.HQ,
        fixedKm: 0,
        geoLat: 28.6139,
        geoLng: 77.2090,
        geoRadius: 5000
      },
      {
        id: 't2',
        name: 'Noida (Ex-HQ)',
        category: ExpenseCategory.EX_HQ,
        fixedKm: 45,
        geoLat: 28.5355,
        geoLng: 77.3910,
        geoRadius: 5000
      },
    ]
  },
  {
    uid: 'mr1',
    email: 'mr@tertius.com',
    displayName: 'Vikram Singh (MR)',
    role: UserRole.MR,
    status: UserStatus.CONFIRMED,
    hqLocation: 'Noida',
    reportingManagerId: 'asm1',
    territories: [
      {
        id: 't1',
        name: 'Noida Sector 18 (HQ)',
        category: ExpenseCategory.HQ,
        fixedKm: 0,
        geoLat: 28.5700,
        geoLng: 77.3200,
        geoRadius: 2000
      },
      {
        id: 't2',
        name: 'Greater Noida (Ex-HQ)',
        category: ExpenseCategory.EX_HQ,
        fixedKm: 60,
        geoLat: 28.4744,
        geoLng: 77.5040,
        geoRadius: 5000
      },
      { id: 't3', name: 'Agra (Outstation)', category: ExpenseCategory.OUTSTATION, fixedKm: 0 },
    ]
  },
  {
    uid: 'mr2',
    email: 'mr2@tertius.com',
    displayName: 'Anita Desai (MR)',
    role: UserRole.MR,
    status: UserStatus.TRAINEE,
    hqLocation: 'Gurgaon',
    reportingManagerId: 'asm1',
    territories: [
      { id: 't1', name: 'Cyber Hub (HQ)', category: ExpenseCategory.HQ, fixedKm: 0 },
      { id: 't2', name: 'Manesar (Ex-HQ)', category: ExpenseCategory.EX_HQ, fixedKm: 35 },
    ]
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  // Noida Sector 18 (MR1)
  { id: 'd1', name: 'Dr. A. Gupta', type: CustomerType.DOCTOR, category: CustomerCategory.A, territoryId: 't1', specialty: 'Cardio', isTagged: true, geoLat: 28.5700, geoLng: 77.3200, lastMonthSales: 15000 },
  { id: 'd2', name: 'Dr. S. Khan', type: CustomerType.DOCTOR, category: CustomerCategory.B, territoryId: 't1', specialty: 'Ortho', isTagged: true, geoLat: 28.5705, geoLng: 77.3205, lastMonthSales: 8000 },
  { id: 'c1', name: 'Apollo Pharmacy Sec 18', type: CustomerType.CHEMIST, category: CustomerCategory.A, territoryId: 't1', isTagged: false, lastMonthSales: 50000 },

  // Greater Noida (MR1)
  { id: 'd3', name: 'Dr. P. Sharma', type: CustomerType.DOCTOR, category: CustomerCategory.A, territoryId: 't2', specialty: 'Physician', isTagged: true, geoLat: 28.4744, geoLng: 77.5040, lastMonthSales: 0 }, // Low sales
  { id: 's1', name: 'G.N. Stockist Agencies', type: CustomerType.STOCKIST, category: CustomerCategory.A, territoryId: 't2', isTagged: true, geoLat: 28.4750, geoLng: 77.5050, lastMonthSales: 150000 },

  // Delhi (ASM1)
  { id: 'd4', name: 'Dr. R. Verma', type: CustomerType.DOCTOR, category: CustomerCategory.A, territoryId: 't1', specialty: 'Neuro', isTagged: true, geoLat: 28.6139, geoLng: 77.2090, lastMonthSales: 25000 },
];

export const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'i1', name: 'CardioPlus 500mg', type: 'SAMPLE', description: 'Sample Pack of 2', unitPrice: 50 },
  { id: 'i2', name: 'OrthoFix Gel', type: 'SAMPLE', description: '10g Tube', unitPrice: 80 },
  { id: 'i3', name: 'Branded Pen', type: 'GIFT', description: 'Metal Parker Pen', unitPrice: 150 },
  { id: 'i4', name: 'Diwali Sweet Box', type: 'GIFT', description: 'Premium Box', unitPrice: 500 },
  { id: 'i5', name: 'Visual Aid Folder', type: 'INPUT', description: '2025 Edition', unitPrice: 200 },
];

export const MOCK_USER_STOCK: UserStock[] = [
  { userId: 'mr1', itemId: 'i1', itemName: 'CardioPlus 500mg', quantity: 50 },
  { userId: 'mr1', itemId: 'i2', itemName: 'OrthoFix Gel', quantity: 20 },
  { userId: 'mr1', itemId: 'i3', itemName: 'Branded Pen', quantity: 5 },
  { userId: 'asm1', itemId: 'i3', itemName: 'Branded Pen', quantity: 50 }, // ASM holds more gifts
];

export const MOCK_TARGETS: SalesTarget[] = [
  { id: 'tgt1', userId: 'mr1', month: new Date().getMonth(), year: new Date().getFullYear(), targetAmount: 200000, achievedAmount: 145000 },
  { id: 'tgt2', userId: 'mr2', month: new Date().getMonth(), year: new Date().getFullYear(), targetAmount: 180000, achievedAmount: 110000 },
];
