import React, { useEffect, useState, useMemo } from 'react';
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
  RefreshCw,
  Check,
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'current' | 'october' | 'september'>('all');

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'all':
        return 'All-Time';
      case 'october':
        return 'October 2026';
      case 'september':
        return 'September 2026';
      case 'current':
      default:
        return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
  }, [selectedPeriod]);

  const load = async (showSpinner = false, periodOverride?: 'all' | 'current' | 'october' | 'september') => {
    const periodToUse = periodOverride || selectedPeriod;
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      let periodArg: string | undefined = undefined;
      let monthArg: number | undefined = undefined;
      let yearArg: number | undefined = undefined;

      if (periodToUse === 'all') {
        periodArg = 'all';
      } else if (periodToUse === 'october') {
        monthArg = 9;
        yearArg = 2026;
      } else if (periodToUse === 'september') {
        monthArg = 8;
        yearArg = 2026;
      }

      const [summary, chart] = await Promise.all([
        api.getDashboardSummary(periodArg, monthArg, yearArg),
        api.getRevenueChart(),
      ]);
      setData(summary);
      setChartData(chart);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      // Default safe empty state if server/network fails
      setData((prev) => prev || {
        kpis: {
          revenueThisMonth: 0,
          totalRevenueAllTime: 0,
          pendingAmount: 0,
          expensesThisMonth: 0,
          salariesPaidThisMonth: 0,
          netProfit: 0,
          activeClientsCount: 0,
          activeProjectsCount: 0,
        },
        todaysTasks: [],
        upcomingPayments: [],
        recentActivity: [],
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
  }, [selectedPeriod]);

  useEffect(() => {
    load(true);

    // Event listeners for live updates from Payments, Projects, Expenses
    const handleLiveUpdate = () => {
      load(false);
    };

    window.addEventListener('infynux_payment_updated', handleLiveUpdate);
    window.addEventListener('infynux_data_changed', handleLiveUpdate);

    // Visibility and focus sync
    const handleFocus = () => {
      load(false);
    };
    window.addEventListener('focus', handleFocus);

    // Periodic live polling every 4 seconds
    const interval = setInterval(() => {
      load(false);
    }, 4000);

    return () => {
      window.removeEventListener('infynux_payment_updated', handleLiveUpdate);
      window.removeEventListener('infynux_data_changed', handleLiveUpdate);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleMarkPaymentPaid = async (paymentId: string) => {
    setActionLoadingId(paymentId);
    try {
      await api.updatePayment(paymentId, {
        status: 'PAID',
        receivedDate: new Date().toISOString(),
      });
      await load(false);
    } catch (err) {
      console.error('Failed to mark payment as paid', err);
    } finally {
      setActionLoadingId(null);
    }
  };

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
      {/* Page Title & Live Sync Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white anim-fade-in-up delay-2">
            Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedPeriod === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setSelectedPeriod('current')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedPeriod === 'current'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('october')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedPeriod === 'october'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Oct 2026
            </button>
            <button
              onClick={() => setSelectedPeriod('september')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedPeriod === 'september'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sep 2026
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
          </div>
          <button
            onClick={() => load(false)}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-3">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {selectedPeriod === 'all' ? 'Revenue (All-Time)' : `Revenue (${periodLabel})`}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.revenueThisMonth} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 min-h-10">
            {selectedPeriod === 'all'
              ? 'Total cleared payments across all client projects'
              : `Cleared payments in ${periodLabel}`}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>All-Time: {formatINR(kpis.totalRevenueAllTime ?? kpis.revenueThisMonth)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cleared</span>
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 min-h-10">
            Uncollected project receivables
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{kpis.activeProjectsCount} Active Projects</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Receivables</span>
          </div>
        </div>

        {/* Card 3: Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {selectedPeriod === 'all' ? 'Expenses (All-Time)' : `Expenses (${periodLabel})`}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.expensesThisMonth} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500 dark:text-red-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 min-h-10">
            Operational & tooling expenses
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Category breakdown</span>
            <span className="text-rose-500 font-medium">Expenses</span>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 interactive-card anim-card delay-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {selectedPeriod === 'all' ? 'Net Profit (All-Time)' : `Net Profit (${periodLabel})`}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={kpis.netProfit} prefix="₹" />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 min-h-10">
            Revenue − Expenses − Salaries
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Net Operating Margin</span>
            <span className={kpis.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
              {kpis.netProfit >= 0 ? "Profitable" : "Deficit"}
            </span>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/40">
                        {formatINR(pay.amount)}
                      </span>
                      <button
                        onClick={() => handleMarkPaymentPaid(pay.id)}
                        disabled={actionLoadingId === pay.id}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Mark payment as received"
                      >
                        <Check className="w-3 h-3" />
                        <span>{actionLoadingId === pay.id ? '...' : 'Mark Paid'}</span>
                      </button>
                    </div>
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

