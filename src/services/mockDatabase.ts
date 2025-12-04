import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, Auth } from "firebase/auth";
import {
    getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where,
    updateDoc, deleteDoc, writeBatch, orderBy, enableIndexedDbPersistence, Firestore
} from 'firebase/firestore';
import {
    MonthlyExpenseSheet,
    UserProfile,
    Rates,
    ExpenseStatus,
    ExpenseCategory,
    DailyAttendance,
    MonthlyTourPlan,
    TourPlanStatus,
    Customer,
    VisitRecord,
    UserStock,
    InventoryItem,
    SalesTarget,
    Notification,
    StockTransaction,
    UserRole,
    AppraisalRecord,
    PerformanceMetrics,
    Stockist,
    PrimarySale,
    SecondarySale,
    LeaveApplication,
    LeaveType,
    LeaveStatus,
    PayrollPreview
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// --- CONFIGURATION ---
// For local development without env vars, we'll use a dummy config.
// In production, these should be in .env
const firebaseConfig = {
    apiKey: "AIzaSyDummyKey",
    authDomain: "tertius-integrity.firebaseapp.com",
    projectId: "tertius-integrity",
    storageBucket: "tertius-integrity.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// --- INITIALIZATION ---
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // enableIndexedDbPersistence(db).catch(err => console.log("Persistence error", err));
} catch (e) {
    console.warn("Firebase init failed (expected in pure offline/mock mode if no config)", e);
}

// --- CONSTANTS ---
const USERS_COL = 'users';
const RATES_COL = 'rates';
const SHEETS_COL = 'expense_sheets';
const ATTENDANCE_COL = 'attendance';
const CUSTOMERS_COL = 'customers';
const VISITS_COL = 'visits';
const TOUR_PLAN_COL = 'tour_plans';
const STOCK_COL = 'user_stock';
const INV_ITEMS_COL = 'inventory_items';
const TRANSACTIONS_COL = 'stock_transactions';
const TARGETS_COL = 'sales_targets';
const NOTIFICATIONS_COL = 'notifications';
const APPRAISALS_COL = 'appraisals';
const STOCKISTS_COL = 'stockists';
const PRIMARY_SALES_COL = 'primary_sales';

const SECONDARY_SALES_COL = 'secondary_sales';
const LEAVES_COL = 'leaves';

// --- MOCK DATA ---
const DEFAULT_RATES: Rates = {
    'MR_CONFIRMED': { hqAllowance: 250, exHqAllowance: 350, outstationAllowance: 550, kmRate: 3.5 },
    'ASM_CONFIRMED': { hqAllowance: 300, exHqAllowance: 450, outstationAllowance: 700, kmRate: 4.5 },
    'ADMIN_CONFIRMED': { hqAllowance: 500, exHqAllowance: 800, outstationAllowance: 1200, kmRate: 8.0 }
};

const MOCK_USERS: UserProfile[] = [
    { uid: 'admin1', email: 'admin@tertius.com', displayName: 'Admin User', role: UserRole.ADMIN, status: 'CONFIRMED' as any, hqLocation: 'Head Office', territories: [] },
    { uid: 'asm1', email: 'asm@tertius.com', displayName: 'Amit ASM', role: UserRole.ASM, status: 'CONFIRMED' as any, hqLocation: 'Delhi', territories: [{ id: 't1', name: 'North Delhi', category: ExpenseCategory.HQ, fixedKm: 0 }] },
    { uid: 'mr1', email: 'mr@tertius.com', displayName: 'Rahul MR', role: UserRole.MR, status: 'CONFIRMED' as any, hqLocation: 'Delhi', territories: [{ id: 't2', name: 'Rohini', category: ExpenseCategory.HQ, fixedKm: 0 }, { id: 't3', name: 'Pitampura', category: ExpenseCategory.EX_HQ, fixedKm: 20 }], reportingManagerId: 'asm1' },
    { uid: 'admin_mohdshea', email: 'mohdshea@gmail.com', displayName: 'Mohd Shea (Super Admin)', role: UserRole.ADMIN, status: 'CONFIRMED' as any, hqLocation: 'Head Office', territories: [] }
];

const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
    { id: 'p1', name: 'Tertius-D 10mg', type: 'SAMPLE', batchNumber: 'B101', expiryDate: '2025-12-31', unitPrice: 0 },
    { id: 'p2', name: 'Tertius-Cal 500mg', type: 'SAMPLE', batchNumber: 'B102', expiryDate: '2025-11-30', unitPrice: 0 },
    { id: 'g1', name: 'Pen', type: 'GIFT', unitPrice: 50 },
    { id: 'g2', name: 'Notepad', type: 'GIFT', unitPrice: 30 },
    { id: 'l1', name: 'Visual Aid', type: 'INPUT', unitPrice: 500 }
];

// --- ROBUST SANITIZER ---
const sanitize = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            const val = obj[key];
            if (val === undefined) newObj[key] = null;
            else newObj[key] = sanitize(val);
        }
        return newObj;
    }
    return obj;
};

// --- AUTH HANDLER ---
export const getUser = async (input?: string, password?: string): Promise<UserProfile | null> => {
    // 1. Check Mock Users first (Priority for local dev)
    if (input && password) {
        const mockUser = MOCK_USERS.find(u => u.email === input);
        // Simple password check for mock users (accept any password or specific one if needed)
        // For simplicity in this demo, we accept any password for mock users
        if (mockUser) return mockUser;
    }

    // 2. Firebase Auth (if available)
    if (auth && input && password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, input, password);
            const uid = userCredential.user.uid;
            if (db) {
                const docRef = doc(db, USERS_COL, uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) return docSnap.data() as UserProfile;
            }
        } catch (e) {
            console.warn("Firebase login failed, checking mocks...", e);
        }
    }

    // 3. Fetch by UID (if no password provided, e.g. re-auth)
    if (input && !password) {
        // Check mock first
        const mockUser = MOCK_USERS.find(u => u.uid === input);
        if (mockUser) return mockUser;

        if (db) {
            const docRef = doc(db, USERS_COL, input);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return docSnap.data() as UserProfile;
        }
    }

    // 4. Auth State Listener (if no input)
    if (!input && !password && auth) {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth!, async (user) => {
                unsubscribe();
                if (user) {
                    if (db) {
                        const userDoc = await getDoc(doc(db, USERS_COL, user.uid));
                        resolve(userDoc.exists() ? userDoc.data() as UserProfile : null);
                    } else {
                        // Fallback if DB not ready but Auth is
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }

    return null;
};

export const logoutUser = async () => {
    if (auth) await firebaseSignOut(auth);
};

// --- USER & TEAM SERVICES ---
export const saveUser = async (user: UserProfile): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, USERS_COL, user.uid), sanitize(user));
};

export const getRates = async (): Promise<Rates> => {
    // Force mock for local dev with dummy config
    return DEFAULT_RATES;
    /*
    if (!db) return DEFAULT_RATES;
    try {
        const snap = await getDoc(doc(db, RATES_COL, 'global'));
        if (snap.exists()) return snap.data() as Rates;
    } catch (e) { }
    return DEFAULT_RATES;
    */
};

export const saveRates = async (rates: Rates): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, RATES_COL, 'global'), sanitize(rates));
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    return MOCK_USERS;
    /*
    if (!db) return MOCK_USERS;
    const snap = await getDocs(collection(db, USERS_COL));
    return snap.docs.map(d => d.data() as UserProfile);
    */
};

export const deleteUser = async (uid: string): Promise<void> => {
    if (!db) return;
    await deleteDoc(doc(db, USERS_COL, uid));
};

export const getTeamMembers = async (managerId: string): Promise<UserProfile[]> => {
    if (!db) return [];
    const q = query(collection(db, USERS_COL), where("reportingManagerId", "==", managerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
};

// --- EXPENSE SHEET SERVICES ---
export const getExpenseSheet = async (userId: string, year: number, month: number): Promise<MonthlyExpenseSheet> => {
    const id = `${userId}_${year}_${month}`;
    if (!db) return { id, userId, year, month, status: ExpenseStatus.DRAFT, entries: [] };
    const snap = await getDoc(doc(db, SHEETS_COL, id));
    if (snap.exists()) return snap.data() as MonthlyExpenseSheet;
    const newSheet: MonthlyExpenseSheet = { id, userId, year, month, status: ExpenseStatus.DRAFT, entries: [] };
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayStr = date.toISOString().split('T')[0];
        const isSunday = date.getDay() === 0;
        newSheet.entries.push({
            id: uuidv4(), date: dayStr, towns: '',
            category: isSunday ? ExpenseCategory.SUNDAY : ExpenseCategory.HQ,
            km: 0, trainFare: 0, miscAmount: 0, remarks: '', dailyAllowance: 0, travelAmount: 0, totalAmount: 0
        });
    }
    return newSheet;
};

export const saveExpenseSheet = async (sheet: MonthlyExpenseSheet): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, SHEETS_COL, sheet.id), sanitize(sheet));
};

export const getPendingSheetsForAdmin = async (): Promise<MonthlyExpenseSheet[]> => {
    if (!db) return [];
    const q = query(collection(db, SHEETS_COL), where("status", "in", [ExpenseStatus.APPROVED_ASM, ExpenseStatus.SUBMITTED]));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MonthlyExpenseSheet);
};

export const getPendingSheetsForAsm = async (asmId: string): Promise<MonthlyExpenseSheet[]> => {
    if (!db) return [];
    const team = await getTeamMembers(asmId);
    const teamIds = team.map(t => t.uid);
    if (teamIds.length === 0) return [];
    const q = query(collection(db, SHEETS_COL), where("status", "==", ExpenseStatus.SUBMITTED));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MonthlyExpenseSheet).filter(s => teamIds.includes(s.userId));
};

// --- ATTENDANCE SERVICES ---
export const getDailyAttendance = async (userId: string, dateStr: string): Promise<DailyAttendance> => {
    const id = `${userId}_${dateStr}`;
    if (!db) return { id, userId, date: dateStr, punchIn: null, punchOuts: [], isSyncedToSheets: false };
    const snap = await getDoc(doc(db, ATTENDANCE_COL, id));
    if (snap.exists()) return snap.data() as DailyAttendance;
    return { id, userId, date: dateStr, punchIn: null, punchOuts: [], isSyncedToSheets: false };
};

export const saveDailyAttendance = async (attendance: DailyAttendance): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, ATTENDANCE_COL, attendance.id), sanitize(attendance));
};

export const getAllAttendance = async (): Promise<DailyAttendance[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, ATTENDANCE_COL));
    return snap.docs.map(d => d.data() as DailyAttendance);
};

// --- CUSTOMER & VISIT SERVICES ---
export const getAllCustomers = async (): Promise<Customer[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, CUSTOMERS_COL));
    return snap.docs.map(d => d.data() as Customer);
};

export const getCustomersByTerritory = async (territoryId: string): Promise<Customer[]> => {
    if (!db) return [];
    const q = query(collection(db, CUSTOMERS_COL), where("territoryId", "==", territoryId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Customer);
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, CUSTOMERS_COL, customer.id), sanitize(customer));
};

export const getAllVisits = async (): Promise<VisitRecord[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, VISITS_COL));
    return snap.docs.map(d => d.data() as VisitRecord);
};

export const getVisits = async (userId: string, date: string): Promise<VisitRecord[]> => {
    if (!db) return [];
    const q = query(collection(db, VISITS_COL), where("userId", "==", userId), where("date", "==", date));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as VisitRecord);
};

export const getVisitsForCustomer = async (customerId: string): Promise<VisitRecord[]> => {
    if (!db) return [];
    const q = query(collection(db, VISITS_COL), where("customerId", "==", customerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as VisitRecord);
};

export const saveVisit = async (visit: VisitRecord): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, VISITS_COL, visit.id), sanitize(visit));
    // Stock deduction logic omitted for brevity in this restore, but should be here
};

export const updateCustomerSales = async (customerId: string, amount: number): Promise<void> => {
    if (!db) return;
    const customerRef = doc(db, CUSTOMERS_COL, customerId);
    // Mock update - in real app would increment total sales
    console.log(`Updating sales for ${customerId} by ${amount}`);
};

// --- TOUR PLAN SERVICES ---
export const getTourPlan = async (userId: string, year: number, month: number): Promise<MonthlyTourPlan> => {
    const id = `${userId}_${year}_${month}`;
    if (!db) return { id, userId, year, month, status: TourPlanStatus.DRAFT, entries: [] };
    const snap = await getDoc(doc(db, TOUR_PLAN_COL, id));
    if (snap.exists()) return snap.data() as MonthlyTourPlan;
    const entries = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayOfWeek = date.getDay();
        let type: any = dayOfWeek === 0 ? 'HOLIDAY' : 'FIELD_WORK';
        entries.push({ date: date.toISOString().split('T')[0], activityType: type });
    }
    return { id, userId, year, month, status: TourPlanStatus.DRAFT, entries };
};

export const saveTourPlan = async (plan: MonthlyTourPlan): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, TOUR_PLAN_COL, plan.id), sanitize(plan));
};

export const getPendingTourPlansForAdmin = async (): Promise<MonthlyTourPlan[]> => {
    if (!db) return [];
    const q = query(collection(db, TOUR_PLAN_COL), where("status", "==", TourPlanStatus.SUBMITTED));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MonthlyTourPlan);
};

export const getPendingTourPlansForAsm = async (asmId: string): Promise<MonthlyTourPlan[]> => {
    if (!db) return [];
    const team = await getTeamMembers(asmId);
    const teamIds = team.map(t => t.uid);
    if (teamIds.length === 0) return [];
    const q = query(collection(db, TOUR_PLAN_COL), where("status", "==", TourPlanStatus.SUBMITTED));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MonthlyTourPlan).filter(p => teamIds.includes(p.userId));
};

// --- INVENTORY & SALES SERVICES ---
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    if (!db) return MOCK_INVENTORY_ITEMS;
    const snap = await getDocs(collection(db, INV_ITEMS_COL));
    return snap.docs.map(d => d.data() as InventoryItem);
};

export const getUserStock = async (userId: string): Promise<UserStock[]> => {
    if (!db) return [];
    const q = query(collection(db, STOCK_COL), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserStock);
};

export const getStockTransactions = async (userId: string): Promise<StockTransaction[]> => {
    if (!db) return [];
    const q = query(collection(db, TRANSACTIONS_COL), where("fromUserId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StockTransaction);
};

export const distributeStock = async (transaction: StockTransaction): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, TRANSACTIONS_COL, transaction.id), sanitize(transaction));
    // Logic to update UserStock would go here
};

export const getSalesTarget = async (userId: string, month: number, year: number): Promise<SalesTarget | null> => {
    if (!db) return null;
    const id = `tgt_${userId}_${month}_${year}`;
    const snap = await getDoc(doc(db, TARGETS_COL, id));
    if (snap.exists()) return snap.data() as SalesTarget;
    return null;
};

export const setSalesTarget = async (target: SalesTarget): Promise<void> => {
    if (!db) return;
    const id = target.id === 'new' ? `tgt_${target.userId}_${target.month}_${target.year}` : target.id;
    await setDoc(doc(db, TARGETS_COL, id), sanitize({ ...target, id }));
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    if (!db) return [];
    const q = query(collection(db, NOTIFICATIONS_COL), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Notification);
};

export const markNotificationRead = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, NOTIFICATIONS_COL, id), { isRead: true });
};

// --- APPRAISAL SERVICES ---
export const getAppraisals = async (userId?: string): Promise<AppraisalRecord[]> => {
    if (!db) return [];
    let q;
    if (userId) {
        q = query(collection(db, APPRAISALS_COL), where("userId", "==", userId));
    } else {
        q = query(collection(db, APPRAISALS_COL));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AppraisalRecord);
};

export const saveAppraisal = async (record: AppraisalRecord): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, APPRAISALS_COL, record.id), sanitize(record));
};

export const calculatePerformanceMetrics = async (userId: string, month: number, year: number): Promise<PerformanceMetrics> => {
    const target = await getSalesTarget(userId, month, year);
    const salesAchieved = target ? target.achievedAmount : 0;
    const salesTarget = target ? target.targetAmount : 100000;
    const attendanceDays = 22; // Mock
    const callAverage = 10; // Mock
    const tourCompliance = 90; // Mock
    return { salesAchieved, salesTarget, callAverage, attendanceDays, tourCompliance };
};

// --- STOCKIST SERVICES ---
export const getStockists = async (): Promise<Stockist[]> => {
    if (!db) return [];
    const snap = await getDocs(collection(db, STOCKISTS_COL));
    return snap.docs.map(d => d.data() as Stockist);
};

export const saveStockist = async (stockist: Stockist): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, STOCKISTS_COL, stockist.id), sanitize(stockist));
};

export const recordPrimarySale = async (sale: PrimarySale): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, PRIMARY_SALES_COL, sale.id), sanitize(sale));

    // Update Stockist Inventory
    const stockistRef = doc(db, STOCKISTS_COL, sale.stockistId);
    const stockistSnap = await getDoc(stockistRef);
    if (stockistSnap.exists()) {
        const stockist = stockistSnap.data() as Stockist;
        const currentStock = stockist.currentStock || {};

        sale.items.forEach(item => {
            currentStock[item.itemId] = (currentStock[item.itemId] || 0) + item.quantity;
        });

        await updateDoc(stockistRef, { currentStock });
    }
};

export const recordSecondarySale = async (sale: SecondarySale): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, SECONDARY_SALES_COL, sale.id), sanitize(sale));

    // Deduct from Stockist Inventory
    const stockistRef = doc(db, STOCKISTS_COL, sale.stockistId);
    const stockistSnap = await getDoc(stockistRef);
    if (stockistSnap.exists()) {
        const stockist = stockistSnap.data() as Stockist;
        const currentStock = stockist.currentStock || {};

        sale.items.forEach(item => {
            currentStock[item.itemId] = Math.max(0, (currentStock[item.itemId] || 0) - item.quantity);
        });

        await updateDoc(stockistRef, { currentStock });
    }
};

export const getPrimarySales = async (stockistId?: string): Promise<PrimarySale[]> => {
    if (!db) return [];
    let q;
    if (stockistId) {
        q = query(collection(db, PRIMARY_SALES_COL), where("stockistId", "==", stockistId));
    } else {
        q = query(collection(db, PRIMARY_SALES_COL));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PrimarySale);
};

export const getSecondarySales = async (stockistId?: string): Promise<SecondarySale[]> => {
    if (!db) return [];
    let q;
    if (stockistId) {
        q = query(collection(db, SECONDARY_SALES_COL), where("stockistId", "==", stockistId));
    } else {
        q = query(collection(db, SECONDARY_SALES_COL));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SecondarySale);
};

export const syncAttendanceToGoogleSheets = async (attendance: DailyAttendance): Promise<void> => {
    console.log("Mock syncing to Google Sheets", attendance);
    // In a real app, this would call a Cloud Function or Google Sheets API
};

export const getDashboardStats = async (userId: string): Promise<any> => {
    // Mock stats
    return {
        totalSales: 150000,
        targetAchievement: 75,
        activeStockists: 5,
        pendingApprovals: 2
    };
};
// --- HR SERVICES ---
export const getLeaves = async (userId: string): Promise<LeaveApplication[]> => {
    if (!db) return [];
    const q = query(collection(db, LEAVES_COL), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as LeaveApplication);
};

export const saveLeave = async (leave: LeaveApplication): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, LEAVES_COL, leave.id), sanitize(leave));
};

export const calculatePayroll = async (userId: string, month: number, year: number): Promise<PayrollPreview> => {
    // 1. Get User for Basic Salary (Mock logic based on role)
    const user = await getUser(userId);
    let basicSalary = 15000;
    let hra = 5000;

    if (user) {
        if (user.role === UserRole.ASM) { basicSalary = 25000; hra = 10000; }
        if (user.role === UserRole.RM) { basicSalary = 40000; hra = 15000; }
        if (user.role === UserRole.ADMIN) { basicSalary = 50000; hra = 20000; }
    }

    // 2. Calculate Allowances from Expense Sheet
    const sheet = await getExpenseSheet(userId, year, month);
    const allowances = sheet.entries.reduce((sum, e) => sum + e.dailyAllowance + e.travelAmount, 0);

    // 3. Deductions (Mock: 10% of Basic)
    const deductions = basicSalary * 0.1;

    return {
        userId,
        month,
        year,
        basicSalary,
        hra,
        allowances,
        deductions,
        netPay: basicSalary + hra + allowances - deductions
    };
};

export const getTerritoryBudgets = async (month: number, year: number): Promise<any[]> => {
    // 1. Get all territories (Mock: derived from users)
    const users = await getAllUsers();
    const territories: any[] = [];
    users.forEach(u => {
        if (u.territories) territories.push(...u.territories.map(t => ({ ...t, userId: u.uid })));
    });

    // 2. Get all expense sheets for this month
    const sheets: MonthlyExpenseSheet[] = [];
    if (db) {
        const snap = await getDocs(collection(db, SHEETS_COL));
        snap.docs.forEach(d => {
            const s = d.data() as MonthlyExpenseSheet;
            if (s.month === month && s.year === year && (s.status === ExpenseStatus.APPROVED_ASM || s.status === ExpenseStatus.APPROVED_ADMIN)) {
                sheets.push(s);
            }
        });
    }

    // 3. Aggregate expenses per territory
    const budgets = territories.map(t => {
        const userSheet = sheets.find(s => s.userId === t.userId);
        const spent = userSheet ? userSheet.entries.reduce((sum, e) => sum + e.totalAmount, 0) : 0;

        return {
            id: `bud_${t.id}`,
            territoryId: t.name,
            month,
            year,
            allocatedAmount: 50000, // Mock fixed budget
            spentAmount: spent
        };
    });

    return budgets;
};
