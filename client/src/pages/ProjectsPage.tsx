import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Project, Client, ProjectType, ProjectStatus, Priority, Payment, PaymentStatus } from '../types';
import { formatINR, formatDate } from '../lib/formatters';
import { Modal } from '../components/common/Modal';
import {
  Briefcase,
  Plus,
  Building,
  Edit2,
  Archive,
  RotateCcw,
  LayoutGrid,
  List,
  Search,
  CreditCard,
  Check,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('WEBSITE');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [totalValue, setTotalValue] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Edit Project Modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('PLANNING');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editTotalValue, setEditTotalValue] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editExpectedEndDate, setEditExpectedEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Project Payments Modal State
  const [paymentModalProject, setPaymentModalProject] = useState<Project | null>(null);
  const [projectPayments, setProjectPayments] = useState<Payment[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
  const [payLabel, setPayLabel] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState<PaymentStatus>('PAID');
  const [payDueDate, setPayDueDate] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer (NEFT)');
  const [payNotes, setPayNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [projs, cls] = await Promise.all([
      api.getProjects(statusFilter || undefined),
      api.getClients(),
    ]);
    setProjects(projs);
    setClients(cls);
    if (cls.length > 0 && !clientId) {
      setClientId(cls[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Quick Status Transition Handler
  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    setUpdatingId(projectId);
    try {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      await api.updateProject(projectId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId || !totalValue) return;

    await api.createProject({
      name,
      clientId,
      projectType,
      priority,
      totalValue: Number(totalValue),
      startDate: startDate || undefined,
      expectedEndDate: expectedEndDate || undefined,
      notes,
    });

    setIsCreateOpen(false);
    setName('');
    setTotalValue('');
    setNotes('');
    loadData();
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditStatus(proj.status);
    setEditPriority(proj.priority);
    setEditTotalValue(String(proj.totalValue));
    setEditStartDate(proj.startDate ? proj.startDate.split('T')[0] : '');
    setEditExpectedEndDate(proj.expectedEndDate ? proj.expectedEndDate.split('T')[0] : '');
    setEditNotes(proj.notes || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim() || !editTotalValue) return;

    await api.updateProject(editingProject.id, {
      name: editName,
      status: editStatus,
      priority: editPriority,
      totalValue: Number(editTotalValue),
      startDate: editStartDate || undefined,
      expectedEndDate: editExpectedEndDate || undefined,
      notes: editNotes,
    });

    setEditingProject(null);
    loadData();
  };

  const openPaymentModal = async (proj: Project) => {
    setPaymentModalProject(proj);
    const pays = await api.getPayments(proj.id);
    setProjectPayments(pays);
    setIsAddingPayment(false);
    setPayLabel('Milestone Payment');
    const remaining = Math.max(0, Number(proj.totalValue) - (proj.metrics?.amountPaid || 0));
    setPayAmount(remaining > 0 ? String(remaining) : '');
    setPayStatus('PAID');
    setPayDueDate(new Date().toISOString().split('T')[0]);
    setPayNotes('');
  };

  const handleAddProjectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalProject || !payLabel || !payAmount) return;

    await api.createPayment({
      projectId: paymentModalProject.id,
      label: payLabel,
      amount: Number(payAmount),
      status: payStatus,
      dueDate: payDueDate || undefined,
      receivedDate: payStatus === 'PAID' ? payDueDate || new Date().toISOString().split('T')[0] : undefined,
      method: payMethod,
      notes: payNotes,
    });

    const [updatedPays, updatedProjs] = await Promise.all([
      api.getPayments(paymentModalProject.id),
      api.getProjects(statusFilter || undefined),
    ]);
    setProjectPayments(updatedPays);
    setProjects(updatedProjs);
    const updatedCur = updatedProjs.find((p) => p.id === paymentModalProject.id);
    if (updatedCur) {
      setPaymentModalProject(updatedCur);
    }
    setIsAddingPayment(false);
    setPayAmount('');
    setPayNotes('');
  };

  const handleQuickMarkPaymentPaid = async (paymentId: string) => {
    if (!paymentModalProject) return;
    await api.updatePayment(paymentId, {
      status: 'PAID',
      receivedDate: new Date().toISOString().split('T')[0],
    });
    const [updatedPays, updatedProjs] = await Promise.all([
      api.getPayments(paymentModalProject.id),
      api.getProjects(statusFilter || undefined),
    ]);
    setProjectPayments(updatedPays);
    setProjects(updatedProjs);
    const updatedCur = updatedProjs.find((p) => p.id === paymentModalProject.id);
    if (updatedCur) {
      setPaymentModalProject(updatedCur);
    }
  };

  const getStatusBadgeStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'WAITING_FOR_CLIENT':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'ARCHIVED':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.client?.name && p.client.name.toLowerCase().includes(q)) ||
      (p.client?.company && p.client.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Projects
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle (Grid / Table) */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by name or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600 shrink-0"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PLANNING">Planning</option>
            <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium self-end sm:self-auto">
          <span>{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}</span>
        </div>
      </div>

      {/* Projects List Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading projects ledger...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? 'No projects match your search query.'
              : statusFilter === 'ARCHIVED'
              ? 'No projects currently in archived state.'
              : 'Create your first project to start tracking milestones.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Simple & Clear Table View */
        <div className="rounded-2xl glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Collected</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredProjects.map((proj) => {
                  const metrics = proj.metrics || {
                    amountPaid: 0,
                    amountDue: proj.totalValue,
                    progressPercentage: 0,
                  };
                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <span>{proj.name}</span>
                          <span className="block text-[10px] font-normal text-slate-400 uppercase">
                            {proj.projectType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {proj.client?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={proj.status}
                          disabled={updatingId === proj.id}
                          onChange={(e) => handleStatusChange(proj.id, e.target.value as ProjectStatus)}
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none transition-all ${getStatusBadgeStyle(
                            proj.status
                          )}`}
                        >
                          <option value="PLANNING">Planning</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING_FOR_CLIENT">Waiting</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            proj.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                              : proj.priority === 'MEDIUM'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {proj.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatINR(proj.totalValue)}
                      </td>
                      <td
                        onClick={() => openPaymentModal(proj)}
                        className="py-3.5 px-4 cursor-pointer group"
                        title="Click to manage payment milestones"
                      >
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium transition-colors">
                              {metrics.progressPercentage}%
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatINR(metrics.amountPaid)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPaymentModal(proj)}
                            title="Manage payments"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(proj)}
                            title="Edit project"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {proj.status === 'ARCHIVED' ? (
                            <button
                              onClick={() => handleStatusChange(proj.id, 'IN_PROGRESS')}
                              title="Restore"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(proj.id, 'ARCHIVED')}
                              title="Archive"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Simple & Clear Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const metrics = proj.metrics || {
              amountPaid: 0,
              amountDue: proj.totalValue,
              progressPercentage: 0,
            };

            const isArchived = proj.status === 'ARCHIVED';

            return (
              <div
                key={proj.id}
                className={`p-5 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4 ${
                  isArchived ? 'opacity-75 bg-slate-50/50 dark:bg-slate-900/30' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Type + Status Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {proj.projectType.replace(/_/g, ' ')}
                    </span>

                    <select
                      value={proj.status}
                      disabled={updatingId === proj.id}
                      onChange={(e) => handleStatusChange(proj.id, e.target.value as ProjectStatus)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none transition-all ${getStatusBadgeStyle(
                        proj.status
                      )}`}
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_CLIENT">Waiting</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  {/* Title & Client */}
                  <div className="mt-2.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{proj.client?.company || proj.client?.name || 'Client'}</span>
                    </p>
                  </div>

                  {/* Payment Progress Bar (Clickable to manage payments) */}
                  <div
                    onClick={() => openPaymentModal(proj)}
                    title="Click to view & update payments"
                    className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 cursor-pointer group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                        <span>Paid:</span>
                        <strong className="text-slate-700 dark:text-slate-200 font-bold">{formatINR(metrics.amountPaid)}</strong>
                        <span className="text-[10px] text-indigo-500 font-normal opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          • Update
                        </span>
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {metrics.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Total Value + Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Total Budget</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{formatINR(proj.totalValue)}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPaymentModal(proj)}
                      title="Manage payments & milestones"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Payments</span>
                    </button>
                    {isArchived ? (
                      <button
                        onClick={() => handleStatusChange(proj.id, 'IN_PROGRESS')}
                        title="Restore to In Progress"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(proj.id, 'ARCHIVED')}
                        title="Archive project"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(proj)}
                      title="Edit project"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Project"
        subtitle="Initialize milestone schedule and assign to client"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme SaaS Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="WEBSITE">Website</option>
                <option value="MOBILE_APP">Mobile App</option>
                <option value="DIGITAL_MARKETING">Digital Marketing</option>
                <option value="SAAS">SaaS</option>
                <option value="CLOUD_DEVOPS">Cloud / DevOps</option>
                <option value="CONSULTING">Consulting</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Total Agreed Value (INR) *</label>
              <input
                type="number"
                required
                placeholder="₹ 75,000"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Target Delivery Date</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Project Scope & Notes</label>
            <textarea
              rows={3}
              placeholder="Milestones, GitHub repo, scope details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-xs"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          title="Edit Project Scope"
          subtitle={editingProject.name}
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Total Agreed Value (INR) *</label>
              <input
                type="number"
                required
                value={editTotalValue}
                onChange={(e) => setEditTotalValue(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={editExpectedEndDate}
                  onChange={(e) => setEditExpectedEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Scope & Notes</label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Project Payments Modal */}
      {paymentModalProject && (
        <Modal
          isOpen={!!paymentModalProject}
          onClose={() => setPaymentModalProject(null)}
          title="Payments & Milestones"
          subtitle={paymentModalProject.name}
        >
          <div className="space-y-4 text-xs">
            {/* Summary Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Budget</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatINR(paymentModalProject.totalValue)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatINR(paymentModalProject.metrics?.amountPaid || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Remaining Due</p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatINR(paymentModalProject.metrics?.amountDue || 0)}
                </p>
              </div>
            </div>

            {/* List of Payments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Recorded Milestones ({projectPayments.length})
                </span>
                {!isAddingPayment && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPayment(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Payment</span>
                  </button>
                )}
              </div>

              {projectPayments.length === 0 ? (
                <div className="py-6 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CreditCard className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  <p>No payments recorded yet for this project.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingPayment(true)}
                    className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
                  >
                    + Record First Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {projectPayments.map((p) => {
                    const isPaid = p.status === 'PAID' || p.status === 'ADVANCE';
                    return (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{p.label}</p>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {p.receivedDate
                              ? `Received on ${formatDate(p.receivedDate)}`
                              : p.dueDate
                              ? `Due ${formatDate(p.dueDate)}`
                              : 'Scheduled'}
                            {p.method ? ` • ${p.method}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-slate-900 dark:text-white">{formatINR(p.amount)}</span>
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => handleQuickMarkPaymentPaid(p.id)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Paid</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Payment Form Inline */}
            {isAddingPayment && (
              <form onSubmit={handleAddProjectPayment} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Record New Payment / Milestone</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingPayment(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Advance (50%)"
                      value={payLabel}
                      onChange={(e) => setPayLabel(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="₹ 10,000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
                    <select
                      value={payStatus}
                      onChange={(e) => setPayStatus(e.target.value as PaymentStatus)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    >
                      <option value="PAID">Paid (Received)</option>
                      <option value="ADVANCE">Advance (Paid)</option>
                      <option value="DUE">Due (Pending)</option>
                      <option value="PARTIAL">Partial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={payDueDate}
                      onChange={(e) => setPayDueDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    >
                      <option value="Bank Transfer (NEFT)">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                  >
                    Save & Update Project
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
