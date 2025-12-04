import React from "react";
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
  Briefcase,
  FileText,
  TrendingUp,
  Package,
  CheckSquare,
  UserCog,
  Database,
  Settings,
  Smartphone,
  LogOut,
  Award,
  Truck,
} from "lucide-react";
import { Logo } from "../Logo";
import { UserProfile, UserRole, MonthlyExpenseSheet } from "../../types";

interface SidebarProps {
  currentUser: UserProfile;
  view: string;
  setView: (view: any) => void;
  pendingApprovals: MonthlyExpenseSheet[];
  onLogout: () => void;
  onInstallApp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  view,
  setView,
  pendingApprovals,
  onLogout,
  onInstallApp,
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isManager = [
    UserRole.ASM,
    UserRole.RM,
    UserRole.ZM,
    UserRole.ADMIN,
  ].includes(currentUser.role);
  const APP_VERSION = "1.5.0";

  const getFirstName = () => {
    if (!currentUser || !currentUser.displayName) return "User";
    return currentUser.displayName.split(" ")[0] || "User";
  };

  const NavItem = ({ id, icon: Icon, label, badge }: any) => {
    const isActive = view === id;
    return (
      <button
        onClick={() => setView(id)}
        className={`w-full flex items-center px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-slate-800 text-white shadow-md border-l-4 border-[#8B1E1E]"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
      >
        <Icon
          size={18}
          className={`mr-3 ${
            isActive
              ? "text-[#8B1E1E]"
              : "text-slate-500 group-hover:text-slate-300"
          }`}
        />
        <span className="font-medium text-sm">{label}</span>
        {badge > 0 && (
          <span className="ml-auto bg-[#8B1E1E] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-full md:w-72 bg-[#0F172A] text-slate-300 flex-shrink-0 no-print flex flex-col h-screen sticky top-0 border-r border-slate-800 font-sans">
      {/* HEADER SECTION */}
      <div className="p-6 pb-4">
        {/* ALIGNMENT FIX: Flex container + specific height */}
        <div className="flex items-center mb-6">
          <Logo className="h-10" variant="light" />
        </div>

        {/* User Profile Card */}
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-xs text-slate-500 mb-0.5">Logged in as</div>
          <div className="font-semibold text-white truncate">
            {getFirstName()}
          </div>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
              {currentUser.role}
            </span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              {currentUser.status}
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION SCROLL AREA */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />

        {!isAdmin && (
          <>
            <div className="mt-4 mb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Field Work
            </div>
            <NavItem id="ATTENDANCE" icon={MapPin} label="Attendance" />
            <NavItem id="TOUR_PLAN" icon={CalendarDays} label="Tour Planner" />
            <NavItem id="REPORTING" icon={Briefcase} label="Field Reporting" />
            <NavItem id="SHEET" icon={FileText} label="My Expenses" />
          </>
        )}

        <div className="mt-4 mb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Commercials
        </div>
        <NavItem id="SALES" icon={TrendingUp} label="Sales" />
        <NavItem id="INVENTORY" icon={Package} label="Inventory" />
        <NavItem id="STOCKISTS" icon={Truck} label="Stockists & Inventory" />

        {isManager && (
          <>
            <div className="mt-4 mb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Management
            </div>
            <NavItem
              id="APPROVALS"
              icon={CheckSquare}
              label="Approvals"
              badge={
                pendingApprovals.length > 0 ? pendingApprovals.length : null
              }
            />
          </>
        )}

        <div className="mt-4 mb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Performance
        </div>
        <NavItem id="PERFORMANCE" icon={Award} label="My Performance" />
        <NavItem id="HR" icon={UserCog} label="HR & Payroll" />
        <NavItem id="FINANCE" icon={TrendingUp} label="Finance & Budget" />
        {isAdmin && (
          <NavItem id="APPRAISALS" icon={TrendingUp} label="Staff Appraisals" />
        )}

        {isAdmin && (
          <>
            <div className="mt-4 mb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Admin Control
            </div>
            <NavItem id="USERS" icon={UserCog} label="Users" />
            <NavItem id="CLIENTS" icon={Database} label="Clients" />
            <NavItem id="SETTINGS" icon={Settings} label="Settings" />
          </>
        )}
      </nav>

      {/* FOOTER ACTION AREA */}
      <div className="p-4 mt-auto border-t border-slate-800 bg-[#0A0F1D]">
        <button
          onClick={onInstallApp}
          className="flex items-center justify-center w-full px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors mb-2"
        >
          <Smartphone size={16} className="mr-2" />
          <span className="text-xs font-medium">Install App</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center justify-center w-full px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-slate-800/50 rounded-md transition-colors"
        >
          <LogOut size={16} className="mr-2" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
        <div className="text-[10px] text-center text-slate-600 font-mono mt-3">
          v{APP_VERSION}
        </div>
      </div>
    </aside>
  );
};
