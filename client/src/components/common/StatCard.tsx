import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface StatCardProps {
  title: string;
  value: number | string;
  isCurrency?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: 'indigo' | 'amber' | 'rose' | 'emerald' | 'cyan';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  isCurrency = true,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  onClick,
}) => {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-600/15 dark:text-indigo-400 dark:border-indigo-500/20',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-500/40',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-500/40',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20',
      borderHover: 'hover:border-rose-300 dark:hover:border-rose-500/40',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-500/40',
    },
    cyan: {
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/20',
      borderHover: 'hover:border-sky-300 dark:hover:border-cyan-500/40',
    },
  }[accentColor];

  const displayValue = isCurrency ? formatINR(value) : value;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 transition-all duration-200 shadow-xs hover:shadow-sm ${colorStyles.borderHover} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">{displayValue}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
              trend.positive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
};
