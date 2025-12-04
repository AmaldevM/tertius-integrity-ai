import React from 'react';
import {
    LayoutDashboard, MapPin, CalendarDays, Briefcase, FileText, TrendingUp, Package,
    CheckSquare, UserCog, Database, Settings, Smartphone, LogOut, Award, Truck
} from 'lucide-react';
import { Logo } from '../Logo';
import { UserProfile, UserRole, MonthlyExpenseSheet } from '../../types';

interface SidebarProps {
    currentUser: UserProfile;
    view: string;
    setView: (view: any) => void;
    pendingApprovals: MonthlyExpenseSheet[];
    onLogout: () => void;
    onInstallApp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentUser, view, setView, pendingApprovals, onLogout, onInstallApp
}) => {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isManager = [UserRole.ASM, UserRole.RM, UserRole.ZM, UserRole.ADMIN].includes(currentUser.role);
    const APP_VERSION = "1.5.0";

    const getFirstName = () => {
        if (!currentUser || !currentUser.displayName) return 'User';
        return currentUser.displayName.split(' ')[0] || 'User';
    };

    const NavItem = ({ id, icon: Icon, label, badge }: any) => (
        <button
            onClick={() => setView(id)}
            className={`flex items-center w-full px-3 py-2.5 rounded-md ${view === id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
        >
            <Icon size={18} className="mr-3" /> {label}
            {badge && <span className="ml-auto bg-blue-600 px-2 rounded-full text-xs">{badge}</span>}
        </button>
    );

    return (
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 no-print flex flex-col">
            <div className="p-6">
                <div className="mb-4"><Logo className="h-8" variant="light" /></div>
                <div className="text-xs text-slate-500">Logged in as {getFirstName()}</div>
                <div className="text-[10px] text-slate-600 uppercase mt-1">{currentUser.role} - {currentUser.status}</div>
            </div>
            <nav className="mt-2 space-y-1 px-3 pb-6 flex-1 overflow-y-auto scrollbar-hide">
                <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />

                {!isAdmin && <>
                    <NavItem id="ATTENDANCE" icon={MapPin} label="Attendance" />
                    <NavItem id="TOUR_PLAN" icon={CalendarDays} label="Tour Planner" />
                    <NavItem id="REPORTING" icon={Briefcase} label="Field Reporting" />
                    <NavItem id="SHEET" icon={FileText} label="My Expenses" />
                </>}

                <NavItem id="SALES" icon={TrendingUp} label="Sales" />
                <NavItem id="INVENTORY" icon={Package} label="Inventory" />
                <NavItem id="STOCKISTS" icon={Truck} label="Stockists & Inventory" />

                {isManager && (
                    <NavItem
                        id="APPROVALS"
                        icon={CheckSquare}
                        label="Approvals"
                        badge={pendingApprovals.length > 0 ? pendingApprovals.length : null}
                    />
                )}

                <div className="pt-2 mt-2 mb-1 px-3 text-xs font-semibold text-slate-500 uppercase">Performance</div>
                <NavItem id="PERFORMANCE" icon={Award} label="My Performance" />
                <NavItem id="HR" icon={UserCog} label="HR & Payroll" />
                <NavItem id="FINANCE" icon={TrendingUp} label="Finance & Budget" />
                {isAdmin && <NavItem id="APPRAISALS" icon={TrendingUp} label="Staff Appraisals" />}

                {isAdmin && <>
                    <div className="pt-2 mt-2 mb-1 px-3 text-xs font-semibold text-slate-500 uppercase">Admin</div>
                    <NavItem id="USERS" icon={UserCog} label="Users" />
                    <NavItem id="CLIENTS" icon={Database} label="Clients" />
                    <NavItem id="SETTINGS" icon={Settings} label="Settings" />
                </>}

                <button onClick={onInstallApp} className="flex items-center w-full px-3 py-2.5 rounded-md text-blue-400 hover:text-blue-300 mt-4">
                    <Smartphone size={18} className="mr-3" /> Install App
                </button>
            </nav>
            <div className="p-4 mt-auto border-t border-slate-800 text-center">
                <button onClick={onLogout} className="flex items-center text-slate-400 hover:text-white w-full mb-2">
                    <LogOut size={18} className="mr-3" /> Sign Out
                </button>
                <div className="text-[10px] text-slate-600 font-mono">v{APP_VERSION}</div>
            </div>
        </aside>
    );
};
