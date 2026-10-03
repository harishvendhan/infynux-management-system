import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  Calendar,
  Compass,
  DollarSign,
  TrendingUp,
  Receipt,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Projects', path: '/projects', icon: Briefcase },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Leads', path: '/leads', icon: Compass },
    {
      label: 'Finance',
      path: '/finance',
      icon: DollarSign,
      subItems: [
        { label: 'Income', path: '/finance?tab=income', icon: TrendingUp },
        { label: 'Expenses', path: '/finance?tab=expenses', icon: Receipt },
        { label: 'Salaries', path: '/finance?tab=salaries', icon: Award },
      ],
    },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 min-h-screen bg-white dark:bg-[#0C1222] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#090D1A]/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white dark:bg-[#0A0E1A] border border-slate-200/90 dark:border-slate-800 shadow-xs shrink-0 ring-1 ring-slate-900/5 dark:ring-indigo-500/20 flex items-center justify-center transition-colors">
                <img
                  src="/logo-light.png"
                  alt="Infynux Logo"
                  className="w-full h-full object-cover dark:hidden"
                />
                <img
                  src="/logo-dark.png"
                  alt="Infynux Logo"
                  className="w-full h-full object-cover hidden dark:block"
                />
              </div>
              <div className="flex items-center">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">INFYNUX</span>
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/80 dark:border-indigo-800/50">
                  OS
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              aria-label="Close sidebar navigation"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => onClose?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs dark:bg-indigo-600/15 dark:text-indigo-400 dark:border-indigo-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/40'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>

                  {item.subItems && (
                    <div className="pl-9 pr-2 py-1 space-y-0.5">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.label}
                            to={sub.path}
                            onClick={() => onClose?.()}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <SubIcon className="w-3 h-3 text-slate-400" />
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

      {/* Admin User Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/60 dark:bg-[#090D1A]/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0 ring-2 ring-indigo-500/20">
              {user?.name?.[0] || 'Y'}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{user?.name || 'Yogeshwaran'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  </>
);
};
