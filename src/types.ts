
export enum UserRole {
  ADMIN = 'ADMIN',
  ZM = 'ZM',
  RM = 'RM',
  ASM = 'ASM',
  MR = 'MR'
}

export enum UserStatus {
  TRAINEE = 'TRAINEE',
  CONFIRMED = 'CONFIRMED'
}

export enum ExpenseCategory {
  HQ = 'HQ',
  EX_HQ = 'EX_HQ',
  OUTSTATION = 'OUTSTATION',
  HOLIDAY = 'HOLIDAY',
  SUNDAY = 'SUNDAY'
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED_ASM = 'APPROVED_ASM',
  APPROVED_ADMIN = 'APPROVED_ADMIN',
  REJECTED = 'REJECTED'
}

export interface RateConfig {
  hqAllowance: number;
  exHqAllowance: number;
  outstationAllowance: number;
  kmRate: number;
}

// Map key format: `${UserRole}_${UserStatus}`
export type Rates = Record<string, RateConfig>;

export interface Territory {
  id: string;
  name: string;
  category: ExpenseCategory;
  fixedKm: number; // Admin fixed distance
  // Geofencing
  geoLat?: number;
  geoLng?: number;
  geoRadius?: number; // meters
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  hqLocation: string;
  state?: string;
  reportingManagerId?: string;
  territories: Territory[];
  hqLat?: number;
  hqLng?: number;
  password?: string; // Added for internal auth
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  territoryId?: string;
  towns: string;
  category: ExpenseCategory;
  km: number;
  trainFare: number;
  miscAmount: number;
  remarks: string;
  dailyAllowance: number;
  travelAmount: number;
  totalAmount: number;
}

export interface MonthlyExpenseSheet {
  id: string;
  userId: string;
  month: number;
  year: number;
  status: ExpenseStatus;
  entries: ExpenseEntry[];
  submittedAt?: string;
  approvedByAsmAt?: string;
  approvedByAdminAt?: string;
  rejectionReason?: string;
}

// --- Attendance Types ---

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  mocked?: boolean;
}

export interface PunchRecord {
  id: string;
  type: 'IN' | 'OUT';
  timestamp: string; // ISO
  location: GeoLocationData;
  verifiedTerritoryId?: string | null;
  verifiedTerritoryName?: string | null;
  notes?: string;
}

export interface DailyAttendance {
  id: string;
  userId: string;
  date: string;
  punchIn: PunchRecord | null;
  punchOuts: PunchRecord[];
  isSyncedToSheets: boolean;
}

// --- Field Reporting Types ---

export enum CustomerType {
  DOCTOR = 'DOCTOR',
  CHEMIST = 'CHEMIST',
  STOCKIST = 'STOCKIST'
}

export enum CustomerCategory {
  A = 'A',
  B = 'B',
  C = 'C'
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  category: CustomerCategory;
  territoryId: string;
  specialty?: string;
  email?: string;
  phone?: string;
  geoLat?: number;
  geoLng?: number;
  isTagged: boolean;
  lastMonthSales: number;
}

export interface VisitRecord {
  id: string;
  date: string;
  timestamp: string;
  userId: string;
  customerId: string;
  customerName: string;
  territoryId: string;
  geoLat: number;
  geoLng: number;
  isVerifiedLocation: boolean;
  jointWorkWithUid?: string;
  jointWorkName?: string;
  productsDiscussed?: string;
  feedback?: string;
  actionsTaken?: string;
  itemsGiven?: { itemId: string; itemName: string; quantity: number }[];
}

// --- Tour Plan Types ---

export enum TourPlanStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface TourPlanEntry {
  date: string;
  territoryId?: string;
  territoryName?: string;
  activityType: 'FIELD_WORK' | 'MEETING' | 'LEAVE' | 'HOLIDAY' | 'ADMIN_DAY';
  jointWorkWithUid?: string;
  notes?: string;
}

export interface MonthlyTourPlan {
  id: string;
  userId: string;
  month: number;
  year: number;
  status: TourPlanStatus;
  entries: TourPlanEntry[];
  approvedByUid?: string;
}

// --- Inventory & Sales Types ---

export type InventoryType = 'SAMPLE' | 'GIFT' | 'INPUT';

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryType;
  description?: string;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface UserStock {
  userId: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface StockTransaction {
  id: string;
  date: string;
  fromUserId: string;
  toUserId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  type: 'ISSUE' | 'RETURN' | 'DISTRIBUTE_TO_DOCTOR';
  relatedVisitId?: string;
}

export interface SalesTarget {
  id: string;
  userId: string;
  month: number;
  year: number;
  targetAmount: number;
  achievedAmount: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.HQ]: 'HQ (Headquarter)',
  [ExpenseCategory.EX_HQ]: 'Ex-HQ',
  [ExpenseCategory.OUTSTATION]: 'Outstation',
  [ExpenseCategory.HOLIDAY]: 'Holiday',
  [ExpenseCategory.SUNDAY]: 'Sunday',
};

// --- Performance Appraisal Types ---

export interface PerformanceMetrics {
  salesAchieved: number;
  salesTarget: number;
  callAverage: number;
  attendanceDays: number;
  tourCompliance: number;
}

export interface AppraisalRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  metrics: PerformanceMetrics;
  managerRating?: number; // 1-5
  adminRating?: number; // 1-5
  comments?: string;
  finalScore: number; // Calculated score
  createdAt: string;
}

export interface Stockist {
  id: string;
  name: string;
  territoryId: string;
  email?: string;
  phone?: string;
  address?: string;
  currentStock: { [itemId: string]: number }; // itemId -> quantity
}

export interface PrimarySale {
  id: string;
  date: string;
  stockistId: string;
  items: { itemId: string; quantity: number; rate: number; amount: number }[];
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'DELIVERED';
}

export interface SecondarySale {
  id: string;
  date: string;
  stockistId: string;
  customerId: string; // Doctor/Clinic
  items: { itemId: string; quantity: number; rate: number; amount: number }[];
  totalAmount: number;
  mrId: string; // MR who facilitated the sale
}

// --- ERP: HR Module Types ---

export enum LeaveType {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  EARNED = 'EARNED'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface LeaveApplication {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
}

export interface PayrollPreview {
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number; // Calculated from expense sheet
  deductions: number;
  netPay: number;
}

// --- ERP: Finance Module Types ---

export interface TerritoryBudget {
  id: string;
  territoryId: string;
  month: number;
  year: number;
  allocatedAmount: number;
  spentAmount: number; // Real-time from expenses
}

export interface FinancialRecord {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  relatedEntityId?: string; // e.g., ExpenseSheet ID or Sale ID
}

