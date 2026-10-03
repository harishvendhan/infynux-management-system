import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatINR, formatDate } from '../lib/formatters';
import { useTheme } from '../context/ThemeContext';
import { exportToExcel, ExcelSheetData } from '../lib/excelExport';
import { BarChart3, Download, TrendingUp, Receipt, Scale, FileSpreadsheet } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await api.getRevenueChart();
      setChartData(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const categoryExpenses = [
    { name: 'Hosting & Cloud', value: 4500, color: '#4F46E5' },
    { name: 'Software Licenses', value: 3200, color: '#EC4899' },
    { name: 'Office & Internet', value: 1999, color: '#10B981' },
  ];

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Sheet 1: Cashflow Overview
      const cashflowRows = chartData.map((e) => ({
        Month: e.month,
        'Revenue (INR)': Number(e.revenue),
        'Expenses (INR)': Number(e.expenses),
        'Net Operating Surplus (INR)': Number(e.revenue - e.expenses),
        'Profit Margin': e.revenue > 0 ? `${Math.round(((e.revenue - e.expenses) / e.revenue) * 100)}%` : '0%',
      }));

      const sheets: ExcelSheetData[] = [
        {
          name: 'Cashflow Overview',
          data: cashflowRows,
          colWidths: [15, 18, 18, 25, 15],
        },
      ];

      // Sheet 2: Payments Ledger & Sheet 3: Expenses Detail
      try {
        const [payments, expenses] = await Promise.all([api.getPayments(), api.getExpenses()]);

        if (payments && payments.length > 0) {
          sheets.push({
            name: 'Payments Ledger',
            data: payments.map((p) => ({
              'Invoice / Milestone': p.label,
              Client: p.project?.client?.name || '—',
              Project: p.project?.name || '—',
              'Amount (INR)': Number(p.amount),
              Status: p.status,
              'Due Date': p.dueDate ? formatDate(p.dueDate) : '—',
              'Received Date': p.receivedDate ? formatDate(p.receivedDate) : '—',
              'Payment Method': p.method || '—',
            })),
            colWidths: [25, 20, 22, 16, 12, 14, 14, 16],
          });
        }

        if (expenses && expenses.length > 0) {
          sheets.push({
            name: 'Expenses Detail',
            data: expenses.map((exp) => ({
              Date: formatDate(exp.date),
              Category: exp.category,
              Description: exp.description,
              'Amount (INR)': Number(exp.amount),
              'Payment Method': exp.paymentMethod || '—',
              Notes: exp.notes || '—',
            })),
            colWidths: [14, 18, 30, 16, 18, 25],
          });
        }
      } catch (err) {
        console.error('Failed to load detailed sheets for Excel export', err);
      }

      exportToExcel(sheets, `Infynux_Financial_Report_${new Date().toISOString().split('T')[0]}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Month,Revenue,Expenses,Net\n' +
      chartData.map((e) => `${e.month},${e.revenue},${e.expenses},${e.revenue - e.expenses}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'infynux_financial_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Financial Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audited monthly cashflow, operational expense distribution, and multi-sheet Excel export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="interactive-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-60"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Generating Excel...' : 'Download Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="interactive-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI strips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel interactive-card space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total H2 Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹8,90,000</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">↑ 22% growth trajectory</p>
        </div>
        <div className="p-5 rounded-2xl glass-panel interactive-card space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total H2 Expenses</p>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">₹93,799</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">10.5% expense-to-revenue ratio</p>
        </div>
        <div className="p-5 rounded-2xl glass-panel interactive-card space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Operating Surplus</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹7,96,201</h3>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Healthy working capital</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Revenue vs Expenses Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl glass-panel space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Monthly Revenue & Overhead</h3>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#F1F5F9'} vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    borderRadius: '0.75rem',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  }}
                  formatter={(value: any) => [formatINR(value), '']}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Expense Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current month breakdown</p>

            <div className="h-44 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                    }}
                    formatter={(val: any) => [formatINR(val), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              {categoryExpenses.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{formatINR(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
