import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';
import { formatINR, formatDate, formatTime } from '../lib/formatters';
import { useTheme } from '../context/ThemeContext';
import {
  TrendingUp,
  AlertCircle,
  Receipt,
  Scale,
  Users,
  Briefcase,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';

/**
 * Smooth Animated Counter using quartic ease-out curve
 * Matching prototype animation curve: 1 - Math.pow(1 - progress, 4)
 */
const AnimatedCounter: React.FC<{
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
}> = ({ value, prefix = '', duration = 1400, className = '' }) => {
  const [displayVal, setDisplayVal] = useState<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayVal(value);
      return;
    }

    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeProgress * Math.abs(value));
      setDisplayVal(value < 0 ? -current : current);

      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      } else {
        setDisplayVal(value);
      }
    };

    animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = Math.abs(displayVal).toLocaleString('en-IN');
  const sign = displayVal < 0 ? '-' : '';

  return (
    <span className={className}>
      {sign}
      {prefix}
      {formatted}
    </span>
  );
};

export const DashboardPage: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [summary, chart] = await Promise.all([
        api.getDashboardSummary(),
        api.getRevenueChart(),
      ]);
      setData(summary);
      setChartData(chart);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading executive dashboard...</span>
        </div>
      </div>
    );
  }

  const { kpis, todaysTasks, upcomingPayments, recentActivity } = data;
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white anim-fade-in-up delay-2">
          Dashboard
        </h2>
      </div>

      {/* KPI Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-3">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Revenue (Month)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.revenueThisMonth} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">
            Collected payments in {currentMonth}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-medium text-xs">
              <ArrowUp className="w-3.5 h-3.5" /> 18%
            </span>
            <span className="text-slate-400 text-xs">vs last month</span>
          </div>
        </div>

        {/* Card 2: Pending Dues */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Pending Dues
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.pendingAmount} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">
            Uncollected project receivables
          </p>
          <div className="h-6" />
        </div>

        {/* Card 3: Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Expenses (Month)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.expensesThisMonth} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500 dark:text-red-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">
            Operational & tooling expenses
          </p>
          <div className="h-6" />
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Net Profit
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.netProfit} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">
            Revenue - Expenses - Salaries
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-medium text-xs">
              <ArrowUp className="w-3.5 h-3.5" /> 24%
            </span>
            <span className="text-slate-400 text-xs">vs last month</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart Area (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-fade-in-up delay-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Revenue & Expenses Trend
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Last 6 months cashflow performance
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#4f46e5]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1E293B' : '#F1F5F9'}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    borderRadius: '0.75rem',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12)',
                  }}
                  formatter={(value: any) => [formatINR(value), '']}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side Cards (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Active Clients */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between interactive-card anim-fade-slide-left delay-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Active Clients
                </p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter value={kpis.activeClientsCount} />
                </h4>
              </div>
            </div>
            <Link
              to="/clients"
              className="view-link text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
            >
              <span>View</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Active Projects */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between interactive-card anim-fade-slide-left delay-9">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#f0f9ff] dark:bg-sky-950/50 flex items-center justify-center text-[#0284c7] dark:text-sky-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Active Projects
                </p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter value={kpis.activeProjectsCount} />
                </h4>
              </div>
            </div>
            <Link
              to="/projects"
              className="view-link text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
            >
              <span>View</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Fast Navigation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-center interactive-card anim-fade-in-up delay-10">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Fast Navigation
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Have an invoice to collect or expenses to submit?
            </p>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <Link
                to="/payments"
                className="interactive-btn bg-[#4f46e5] hover:bg-[#6366f1] text-white py-2.5 px-4 rounded-lg text-sm font-medium text-center shadow-xs"
              >
                Record Payment
              </Link>
              <Link
                to="/finance?tab=expenses"
                className="interactive-btn bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 py-2.5 px-4 rounded-lg text-sm font-medium text-center"
              >
                Log Expense
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Widgets Grid (Today's Tasks, Upcoming Payments, Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-fade-in-up delay-10">
        {/* 1. Today's Tasks */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 interactive-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Today's Schedule</span>
              </h4>
              <Link
                to="/calendar"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Full calendar →
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {todaysTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No tasks or meetings scheduled today.
                </p>
              ) : (
                todaysTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {task.allDay ? 'All Day' : formatTime(task.startAt)}
                        {task.client ? ` • ${task.client.name}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2. Upcoming Payments */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 interactive-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Upcoming Dues</span>
              </h4>
              <Link
                to="/payments"
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
              >
                Payment ledger →
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {upcomingPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No pending dues scheduled.
                </p>
              ) : (
                upcomingPayments.slice(0, 4).map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                        {pay.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {pay.project?.client?.name || pay.project?.name} • Due {formatDate(pay.dueDate)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/40">
                      {formatINR(pay.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Recent Activity Feed */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 interactive-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Recent Activity</span>
              </h4>
            </div>

            <div className="mt-4 space-y-2.5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No recent activity logged.
                </p>
              ) : (
                recentActivity.slice(0, 4).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200">{act.summary}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {formatDate(act.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

