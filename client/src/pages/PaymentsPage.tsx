import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Payment, Project, PaymentStatus } from '../types';
import { formatINR, formatDate } from '../lib/formatters';
import { Modal } from '../components/common/Modal';
import { exportToExcel, ExcelSheetData } from '../lib/excelExport';
import {
  CreditCard,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Building,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dueGrouped, setDueGrouped] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'due_view' | 'ledger'>('due_view');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Record Payment Modal
  const [isRecordOpen, setIsRecordOpen] = useState<boolean>(false);
  const [projectId, setProjectId] = useState('');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('DUE');
  const [dueDate, setDueDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [pays, projs, due] = await Promise.all([
      api.getPayments(),
      api.getProjects(),
      api.getDuePaymentsGrouped(),
    ]);
    setPayments(pays);
    setProjects(projs);
    setDueGrouped(due);
    if (projs.length > 0 && !projectId) {
      setProjectId(projs[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !label || !amount) return;

    await api.createPayment({
      projectId,
      label,
      amount: Number(amount),
      status,
      dueDate: dueDate || undefined,
      receivedDate: receivedDate || undefined,
      method: method || undefined,
      notes,
    });

    setIsRecordOpen(false);
    setLabel('');
    setAmount('');
    setNotes('');
    loadData();
  };

  const handleQuickMarkPaid = async (paymentId: string) => {
    try {
      await api.updatePayment(paymentId, {
        status: 'PAID',
        receivedDate: new Date().toISOString(),
      });
      loadData();
    } catch (e) {
      console.error('Failed to mark payment as paid', e);
    }
  };

  const statusBadge = (st: PaymentStatus) => {
    const config: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
      PAID: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
      ADVANCE: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
      PARTIAL: { bg: 'bg-sky-50 dark:bg-cyan-500/10', text: 'text-sky-700 dark:text-cyan-400', border: 'border-sky-200 dark:border-cyan-500/20' },
      DUE: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
      OVERDUE: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/20' },
      REFUNDED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    };
    const c = config[st] || config.DUE;
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
        {st}
      </span>
    );
  };

  const handleExportExcel = () => {
    if (!payments || payments.length === 0) return;
    const sheetData: ExcelSheetData = {
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
        Notes: p.notes || '—',
      })),
      colWidths: [26, 22, 24, 16, 12, 14, 14, 16, 30],
    };
    exportToExcel([sheetData], `Infynux_Payments_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Payments
          </h2>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('due_view')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'due_view'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending Dues
              {dueGrouped?.counts?.overdueCount ? (
                <span className="text-rose-500 font-bold ml-1">({dueGrouped.counts.overdueCount})</span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ledger <span className="text-[11px] opacity-70">({payments.length})</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            title="Download Payments as Excel (.xlsx)"
            className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsRecordOpen(true)}
            className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* --- DUE VIEW --- */}
      {activeTab === 'due_view' && (
        <div className="space-y-4">
          {/* Overdue Section */}
          <div className="p-5 rounded-2xl glass-panel border-rose-200 dark:border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Overdue Payments ({dueGrouped?.counts?.overdueCount || 0})</span>
              </h3>
              <span className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">Immediate attention</span>
            </div>

            {dueGrouped?.overdue?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">🎉 No overdue payments! All receivables are on track.</p>
            ) : (
              <div className="space-y-2">
                {dueGrouped?.overdue?.map((p: Payment) => (
                  <div key={p.id} className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.label}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.project?.client?.name} • Project: {p.project?.name} • Due: {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{formatINR(p.amount)}</span>
                      <button
                        onClick={() => handleQuickMarkPaid(p.id)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due This Week Section */}
          <div className="p-5 rounded-2xl glass-panel border-amber-200 dark:border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Due This Week ({dueGrouped?.counts?.dueThisWeekCount || 0})</span>
              </h3>
            </div>

            {dueGrouped?.dueThisWeek?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No milestone payments due in the current week.</p>
            ) : (
              <div className="space-y-2">
                {dueGrouped?.dueThisWeek?.map((p: Payment) => (
                  <div key={p.id} className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.label}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.project?.client?.name} • Project: {p.project?.name} • Due: {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400">{formatINR(p.amount)}</span>
                      <button
                        onClick={() => handleQuickMarkPaid(p.id)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- COMPLETE LEDGER TABLE --- */}
      {activeTab === 'ledger' && (
        <div className="rounded-2xl glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transaction / Milestone</th>
                  <th className="py-3 px-4">Client & Project</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due / Received Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{p.label}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <p className="font-medium text-slate-900 dark:text-slate-200">{p.project?.client?.name || 'Client'}</p>
                      <p className="text-[11px] text-slate-400">{p.project?.name}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm">{formatINR(p.amount)}</td>
                    <td className="py-3.5 px-4">{statusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {p.receivedDate ? formatDate(p.receivedDate) : p.dueDate ? `Due ${formatDate(p.dueDate)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{p.method || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status !== 'PAID' && (
                        <button
                          onClick={() => handleQuickMarkPaid(p.id)}
                          className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Payment Transaction"
        subtitle="Log received or scheduled milestone receivable"
      >
        <form onSubmit={handleRecord} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Target Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client?.name || 'Client'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Label *</label>
            <input
              type="text"
              required
              placeholder="e.g. 50% Advance Milestone, Final Handover"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (INR) *</label>
              <input
                type="number"
                required
                placeholder="₹ 25,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="DUE">Due (Pending)</option>
                <option value="PAID">Paid (Received)</option>
                <option value="ADVANCE">Advance Received</option>
                <option value="PARTIAL">Partial</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Received Date (if paid)</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
              <input
                type="text"
                placeholder="UPI, Bank NEFT, Cash..."
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Transaction Ref</label>
              <input
                type="text"
                placeholder="UTR ref, cheque number..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
