import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Expense, Payment, Salary, Employee } from '../types';
import { formatINR, formatDate } from '../lib/formatters';
import { Modal } from '../components/common/Modal';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Award,
  Plus,
  Building,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  Calendar,
  Check,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const EXPENSE_CATEGORIES = [
  'Hosting',
  'Software',
  'Marketing',
  'Travel',
  'Food',
  'Office',
  'Equipment',
  'Internet',
  'Other',
];

export const FinancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'income' | 'expenses' | 'salaries') || 'expenses';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [salaryMonthFilter, setSalaryMonthFilter] = useState('ALL');
  const [salarySearch, setSalarySearch] = useState('');

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Hosting');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Corporate Card');
  const [notes, setNotes] = useState('');

  // Edit Expense Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpDate, setEditExpDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // New / Process Salary Modal State
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState<boolean>(false);
  const [salEmployeeId, setSalEmployeeId] = useState('');
  const [salMonth, setSalMonth] = useState('2026-10');
  const [salBaseSalary, setSalBaseSalary] = useState<number | string>(0);
  const [salBonus, setSalBonus] = useState<number | string>(0);
  const [salDeductions, setSalDeductions] = useState<number | string>(0);
  const [salStatus, setSalStatus] = useState<'PENDING' | 'PAID' | 'PROCESSING'>('PENDING');
  const [salPaidOn, setSalPaidOn] = useState(new Date().toISOString().split('T')[0]);
  const [salNotes, setSalNotes] = useState('');

  // Edit Salary Modal State
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [editSalMonth, setEditSalMonth] = useState('');
  const [editSalBaseSalary, setEditSalBaseSalary] = useState<number | string>(0);
  const [editSalBonus, setEditSalBonus] = useState<number | string>(0);
  const [editSalDeductions, setEditSalDeductions] = useState<number | string>(0);
  const [editSalStatus, setEditSalStatus] = useState<'PENDING' | 'PAID' | 'PROCESSING'>('PENDING');
  const [editSalPaidOn, setEditSalPaidOn] = useState('');
  const [editSalNotes, setEditSalNotes] = useState('');

  // Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'expense' | 'salary';
    id: string;
    title: string;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [exps, pays, sals, emps] = await Promise.all([
      api.getExpenses(),
      api.getPayments(),
      api.getSalaries(),
      api.getEmployees(),
    ]);
    setExpenses(exps);
    setPayments(pays.filter((p) => p.status === 'PAID' || p.status === 'ADVANCE'));
    setSalaries(sals);
    setEmployees(emps);
    if (emps.length > 0 && !salEmployeeId) {
      setSalEmployeeId(emps[0].id);
      setSalBaseSalary(emps[0].baseSalary);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmployeeSelectChange = (empId: string) => {
    setSalEmployeeId(empId);
    const found = employees.find((e) => e.id === empId);
    if (found) {
      setSalBaseSalary(found.baseSalary);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    await api.createExpense({
      date: expDate,
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      notes,
    });

    setIsExpenseModalOpen(false);
    setDescription('');
    setAmount('');
    setNotes('');
    loadData();
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditingExpense(exp);
    setEditExpDate(exp.date ? exp.date.split('T')[0] : '');
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditAmount(String(exp.amount));
    setEditPaymentMethod(exp.paymentMethod || 'Corporate Card');
    setEditNotes(exp.notes || '');
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editDescription.trim() || !editAmount) return;

    await api.updateExpense(editingExpense.id, {
      date: editExpDate,
      category: editCategory,
      description: editDescription,
      amount: Number(editAmount),
      paymentMethod: editPaymentMethod,
      notes: editNotes,
    });

    setEditingExpense(null);
    loadData();
  };

  const confirmDeleteExpense = (exp: Expense) => {
    setItemToDelete({
      type: 'expense',
      id: exp.id,
      title: `${exp.description} (${formatINR(exp.amount)})`,
    });
  };

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salEmployeeId || !salMonth) return;

    await api.createSalary({
      employeeId: salEmployeeId,
      month: salMonth,
      baseSalary: Number(salBaseSalary || 0),
      bonus: Number(salBonus || 0),
      deductions: Number(salDeductions || 0),
      status: salStatus,
      paidOn: salStatus === 'PAID' ? salPaidOn : null,
      notes: salNotes || null,
    });

    setIsSalaryModalOpen(false);
    setSalBonus(0);
    setSalDeductions(0);
    setSalNotes('');
    loadData();
  };

  const openEditSalaryModal = (sal: Salary) => {
    setEditingSalary(sal);
    setEditSalMonth(sal.month);
    setEditSalBaseSalary(sal.baseSalary);
    setEditSalBonus(sal.bonus);
    setEditSalDeductions(sal.deductions);
    setEditSalStatus((sal.status as any) || 'PENDING');
    setEditSalPaidOn(sal.paidOn ? sal.paidOn.split('T')[0] : '');
    setEditSalNotes(sal.notes || '');
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalary) return;

    await api.updateSalary(editingSalary.id, {
      month: editSalMonth,
      baseSalary: Number(editSalBaseSalary || 0),
      bonus: Number(editSalBonus || 0),
      deductions: Number(editSalDeductions || 0),
      status: editSalStatus,
      paidOn: editSalStatus === 'PAID' && editSalPaidOn ? editSalPaidOn : null,
      notes: editSalNotes || null,
    });

    setEditingSalary(null);
    loadData();
  };

  const confirmDeleteSalary = (sal: Salary) => {
    const emp = sal.employee || employees.find((e) => e.id === sal.employeeId);
    setItemToDelete({
      type: 'salary',
      id: sal.id,
      title: `${emp?.name || 'Employee'} - ${sal.month} (${formatINR(sal.finalAmount)})`,
    });
  };

  const handleQuickMarkPaid = async (sal: Salary) => {
    await api.updateSalary(sal.id, {
      status: 'PAID',
      paidOn: new Date().toISOString(),
    });
    loadData();
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'expense') {
      await api.deleteExpense(itemToDelete.id);
    } else {
      await api.deleteSalary(itemToDelete.id);
    }

    setItemToDelete(null);
    loadData();
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        expenseSearch.trim() === '' ||
        e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(expenseSearch.toLowerCase()));
      const matchesCategory =
        expenseCategoryFilter === 'ALL' ||
        e.category.toLowerCase() === expenseCategoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [expenses, expenseSearch, expenseCategoryFilter]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const emp = s.employee || employees.find((e) => e.id === s.employeeId);
      const matchesSearch =
        salarySearch.trim() === '' ||
        (emp && emp.name.toLowerCase().includes(salarySearch.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(salarySearch.toLowerCase()));
      const matchesMonth = salaryMonthFilter === 'ALL' || s.month === salaryMonthFilter;
      return matchesSearch && matchesMonth;
    });
  }, [salaries, employees, salarySearch, salaryMonthFilter]);

  const totalPayrollCommitted = useMemo(() => {
    return filteredSalaries.reduce((sum, s) => sum + Number(s.finalAmount), 0);
  }, [filteredSalaries]);

  const totalSalariesPaid = useMemo(() => {
    return filteredSalaries.filter((s) => s.status === 'PAID').reduce((sum, s) => sum + Number(s.finalAmount), 0);
  }, [filteredSalaries]);

  const totalSalariesPending = useMemo(() => {
    return filteredSalaries.filter((s) => s.status !== 'PAID').reduce((sum, s) => sum + Number(s.finalAmount), 0);
  }, [filteredSalaries]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    salaries.forEach((s) => set.add(s.month));
    return Array.from(set).sort().reverse();
  }, [salaries]);

  const createModalFinalAmount = Math.max(
    0,
    Number(salBaseSalary || 0) + Number(salBonus || 0) - Number(salDeductions || 0)
  );

  const editModalFinalAmount = Math.max(
    0,
    Number(editSalBaseSalary || 0) + Number(editSalBonus || 0) - Number(editSalDeductions || 0)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Finance
          </h2>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setSearchParams({ tab: 'expenses' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'expenses'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expenses <span className="text-[11px] opacity-70">({expenses.length})</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'salaries' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'salaries'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Salaries <span className="text-[11px] opacity-70">({salaries.length})</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'income' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'income'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {currentTab === 'expenses' && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          )}

          {currentTab === 'salaries' && (
            <button
              onClick={() => {
                if (employees.length > 0 && !salEmployeeId) {
                  setSalEmployeeId(employees[0].id);
                  setSalBaseSalary(employees[0].baseSalary);
                }
                setIsSalaryModalOpen(true);
              }}
              className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Process Salary</span>
            </button>
          )}
        </div>
      </div>

      {/* --- EXPENSES TAB --- */}
      {currentTab === 'expenses' && (
        <div className="space-y-3">
          {/* Simple Toolbar: Search + Category Filter + Summary inline */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600 shrink-0"
              >
                <option value="ALL">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium self-end sm:self-auto">
              <span>{filteredExpenses.length} entries</span>
              <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
              <span>Total: <strong className="text-slate-900 dark:text-white font-bold">{formatINR(totalExpenseAmount)}</strong></span>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="rounded-2xl glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description & Notes</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No operational expenses match your query. Click "+ Log Expense" above to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                          {formatDate(exp.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {exp.description}
                          </p>
                          {exp.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-md line-clamp-1">{exp.notes}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {exp.paymentMethod || 'Corporate Card'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white text-right whitespace-nowrap">
                          {formatINR(exp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditExpenseModal(exp)}
                              title="Edit expense"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDeleteExpense(exp)}
                              title="Delete expense"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SALARIES & PAYROLL TAB --- */}
      {currentTab === 'salaries' && (
        <div className="space-y-3">
          {/* Simple Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee or notes..."
                  value={salarySearch}
                  onChange={(e) => setSalarySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              <select
                value={salaryMonthFilter}
                onChange={(e) => setSalaryMonthFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600 shrink-0"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium self-end sm:self-auto flex items-center gap-3">
              <span>Total: <strong className="text-slate-900 dark:text-white font-bold">{formatINR(totalPayrollCommitted)}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(totalSalariesPaid)}</strong></span>
              {totalSalariesPending > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Pending: <strong className="text-amber-600 dark:text-amber-400 font-bold">{formatINR(totalSalariesPending)}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Salaries Table */}
          <div className="rounded-2xl glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Bonus</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status & Paid Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                        No salary records found for this period. Click "+ Process Salary" above to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredSalaries.map((sal) => {
                      const emp = sal.employee || employees.find((e) => e.id === sal.employeeId);
                      const isPaid = sal.status === 'PAID';
                      const isProcessing = sal.status === 'PROCESSING';

                      return (
                        <tr key={sal.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-600/10 dark:text-indigo-400 dark:border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                                {emp?.name?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {emp?.name || 'Employee'}
                                </p>
                                <p className="text-[11px] text-slate-400">{emp?.roleTitle || 'Team Member'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                            {sal.month}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-300 font-semibold">
                            {formatINR(sal.baseSalary)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {sal.bonus > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatINR(sal.bonus)}</span>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {sal.deductions > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">−{formatINR(sal.deductions)}</span>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                              {formatINR(sal.finalAmount)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isPaid ? (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Paid</span>
                                </span>
                                {sal.paidOn && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">Paid on {formatDate(sal.paidOn)}</p>
                                )}
                              </div>
                            ) : isProcessing ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                                <Clock className="w-3 h-3" />
                                <span>Processing</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {!isPaid && (
                                <button
                                  onClick={() => handleQuickMarkPaid(sal)}
                                  title="Quick mark as Paid"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Paid</span>
                                </button>
                              )}
                              <button
                                onClick={() => openEditSalaryModal(sal)}
                                title="Edit salary"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => confirmDeleteSalary(sal)}
                                title="Delete salary"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- INCOME TAB --- */}
      {currentTab === 'income' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Automated Ledger:</strong> Income is derived purely from cleared client payments and project advances. No manual duplication needed.
            </span>
          </div>

          <div className="rounded-2xl glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Received Date</th>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4">Payment Label</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Received Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No cleared payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(p.receivedDate || p.createdAt)}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{p.project?.client?.name || 'Client'}</p>
                          <p className="text-[11px] text-slate-400">{p.project?.name}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{p.label}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{p.method || 'Bank Transfer'}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">{formatINR(p.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Log Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Log Operational Expense"
        subtitle="Track cloud infrastructure, licenses, travel, and operational costs"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud Hosting, Figma Team License"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (INR) *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="e.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
              <input
                type="text"
                placeholder="e.g. Corporate Card, UPI"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Invoice reference or purpose..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Expense Modal */}
      {editingExpense && (
        <Modal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          title="Edit Operational Expense"
          subtitle="Modify expense details, amount, category or payment mode"
        >
          <form onSubmit={handleUpdateExpense} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={editExpDate}
                  onChange={(e) => setEditExpDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description *</label>
              <input
                type="text"
                required
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <input
                  type="text"
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all"
              >
                Update Expense
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Process Salary Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Process Salary Disbursement"
        subtitle="Allocate monthly payroll with base compensation, bonuses, and tax/PF deductions"
      >
        <form onSubmit={handleCreateSalary} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Select Employee *</label>
              <select
                value={salEmployeeId}
                onChange={(e) => handleEmployeeSelectChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.roleTitle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payroll Month (YYYY-MM) *</label>
              <input
                type="month"
                required
                value={salMonth}
                onChange={(e) => setSalMonth(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Base Salary (INR) *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={salBaseSalary}
                onChange={(e) => setSalBaseSalary(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Bonus / Incentive (INR)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={salBonus}
                onChange={(e) => setSalBonus(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-600 font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Deductions (INR)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={salDeductions}
                onChange={(e) => setSalDeductions(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-rose-600 dark:text-rose-400 focus:outline-none focus:border-indigo-600 font-semibold"
              />
            </div>
          </div>

          {/* Dynamic Auto-Calculated Final Preview */}
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Calculated Net Payout
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {formatINR(Number(salBaseSalary || 0))} + {formatINR(Number(salBonus || 0))} − {formatINR(Number(salDeductions || 0))}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatINR(createModalFinalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Disbursement Status</label>
              <select
                value={salStatus}
                onChange={(e) => setSalStatus(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="PENDING">Pending Approval</option>
                <option value="PROCESSING">Processing In Bank</option>
                <option value="PAID">Disbursed (Paid)</option>
              </select>
            </div>

            {salStatus === 'PAID' && (
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  value={salPaidOn}
                  onChange={(e) => setSalPaidOn(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Sprint performance bonus or leave deductions..."
              value={salNotes}
              onChange={(e) => setSalNotes(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsSalaryModalOpen(false)}
              className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all"
            >
              Confirm Disbursement
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Edit Salary Modal */}
      {editingSalary && (
        <Modal
          isOpen={!!editingSalary}
          onClose={() => setEditingSalary(null)}
          title="Edit Salary Record"
          subtitle={`Adjust compensation for ${editingSalary?.employee?.name || 'employee'}`}
        >
          <form onSubmit={handleUpdateSalary} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Employee</label>
                <input
                  type="text"
                  disabled
                  value={editingSalary?.employee?.name || 'Employee'}
                  className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payroll Month *</label>
                <input
                  type="month"
                  required
                  value={editSalMonth}
                  onChange={(e) => setEditSalMonth(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Base Salary (INR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={editSalBaseSalary}
                  onChange={(e) => setEditSalBaseSalary(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Bonus (INR)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editSalBonus}
                  onChange={(e) => setEditSalBonus(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Deductions (INR)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editSalDeductions}
                  onChange={(e) => setEditSalDeductions(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-rose-600 dark:text-rose-400 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Calculated Net Payout
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatINR(Number(editSalBaseSalary || 0))} + {formatINR(Number(editSalBonus || 0))} − {formatINR(Number(editSalDeductions || 0))}
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatINR(editModalFinalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Disbursement Status</label>
                <select
                  value={editSalStatus}
                  onChange={(e) => setEditSalStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="PENDING">Pending Approval</option>
                  <option value="PROCESSING">Processing In Bank</option>
                  <option value="PAID">Disbursed (Paid)</option>
                </select>
              </div>

              {editSalStatus === 'PAID' && (
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    value={editSalPaidOn}
                    onChange={(e) => setEditSalPaidOn(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks / Notes</label>
              <textarea
                rows={2}
                value={editSalNotes}
                onChange={(e) => setEditSalNotes(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingSalary(null)}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          title="Confirm Deletion"
          subtitle="This action will permanently delete this record from the finance ledger."
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Are you sure you want to delete this record?</p>
                <p className="text-slate-600 dark:text-rose-300 mt-1 font-mono">{itemToDelete?.title}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-all"
              >
                Delete Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
