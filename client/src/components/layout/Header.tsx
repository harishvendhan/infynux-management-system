import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AlertCircle, Plus, Clock, ChevronDown, Sun, Moon, Sparkles, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenQuickAdd?: (type: 'client' | 'project' | 'payment' | 'lead') => void;
  onOpenDueDrawer?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickAdd, onOpenDueDrawer, onToggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [greeting, setGreeting] = useState<string>('Good day');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours < 12) setGreeting('Good Morning');
      else if (hours < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      setCurrentTime(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(now)
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0C1222]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Mobile Menu Trigger + Brand / Greeting */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Mini Brand Badge */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white dark:bg-[#0A0E1A] border border-slate-200/90 dark:border-slate-800 shadow-2xs shrink-0 flex items-center justify-center">
            <img src="/logo-light.png" alt="Logo" className="w-full h-full object-cover dark:hidden" />
            <img src="/logo-dark.png" alt="Logo" className="w-full h-full object-cover hidden dark:block" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-xs sm:hidden">INFYNUX</span>
        </div>

        {/* Greeting / User Indicator */}
        <h1 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate hidden sm:block">
          {greeting}, <span className="font-bold text-slate-900 dark:text-white">{user?.name || 'Yogeshwaran'}</span>
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>

          {showAddMenu && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-xl p-1 z-50 animate-in fade-in slide-in-from-top-1 border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900"
              onClick={() => setShowAddMenu(false)}
            >
              <Link
                to="/clients?action=new"
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>+ Client</span>
              </Link>
              <Link
                to="/projects?action=new"
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>+ Project</span>
              </Link>
              <Link
                to="/payments?action=new"
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>+ Payment</span>
              </Link>
              <Link
                to="/leads?action=new"
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>+ Lead</span>
              </Link>
            </div>
          )}
        </div>

        {/* Theme Toggle Button (Icon only) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
