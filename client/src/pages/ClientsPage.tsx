import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Client } from '../types';
import { formatINR, formatDate } from '../lib/formatters';
import { Modal } from '../components/common/Modal';
import { exportToExcel, ExcelSheetData } from '../lib/excelExport';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Briefcase,
  ExternalLink,
  DollarSign,
  Clock,
  Filter,
  Archive,
  RotateCcw,
  LayoutGrid,
  List,
  FileSpreadsheet,
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Client Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Client 360 View Drawer / Modal
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const loadClients = async () => {
    setIsLoading(true);
    const data = await api.getClients(search, filterActive);
    setClients(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, [search, filterActive]);

  const handleToggleClientArchive = async (client: Client) => {
    const nextActive = !client.isActive;
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, isActive: nextActive } : c))
    );
    try {
      await api.updateClient(client.id, { isActive: nextActive });
    } catch (err) {
      console.error('Failed to update client active state', err);
    }
    loadClients();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await api.createClient({
      name: newName,
      company: newCompany,
      phone: newPhone,
      email: newEmail,
      address: newAddress,
      notes: newNotes,
    });

    setIsCreateOpen(false);
    setNewName('');
    setNewCompany('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNotes('');
    loadClients();
  };

  const handleExportExcel = () => {
    if (!clients || clients.length === 0) return;
    const sheetData: ExcelSheetData = {
      name: 'Clients Directory',
      data: clients.map((c) => ({
        'Client Name': c.name,
        Company: c.company || '—',
        Email: c.email || '—',
        Phone: c.phone || '—',
        Address: c.address || '—',
        Status: c.isActive ? 'Active' : 'Archived',
        'Projects Count': c.metrics?.projectCount || c.projects?.length || 0,
        'Total Business (INR)': Number(c.metrics?.totalBusiness || 0),
        'Total Paid (INR)': Number(c.metrics?.totalPaid || 0),
        'Total Pending (INR)': Number(c.metrics?.totalPending || 0),
        'Created Date': formatDate(c.createdAt),
        Notes: c.notes || '—',
      })),
      colWidths: [22, 22, 25, 18, 25, 12, 16, 20, 18, 18, 15, 30],
    };
    exportToExcel([sheetData], `Infynux_Clients_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Clients
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle */}
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
            onClick={handleExportExcel}
            title="Download Clients Directory as Excel (.xlsx)"
            className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <select
            value={filterActive === undefined ? 'ALL' : filterActive ? 'ACTIVE' : 'INACTIVE'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'ALL') setFilterActive(undefined);
              else if (val === 'ACTIVE') setFilterActive(true);
              else setFilterActive(false);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600 shrink-0"
          >
            <option value="ALL">All Clients</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Archived</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium self-end sm:self-auto">
          <span>{clients.length} {clients.length === 1 ? 'client' : 'clients'}</span>
        </div>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading client directory...</div>
      ) : clients.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No clients found</p>
          <p className="text-xs text-slate-400 mt-1">Add your first client to start organizing projects and payments.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-2xl glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Phone / Email</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Pending</th>
                  <th className="py-3 px-4 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {clients.map((client) => {
                  const metrics = client.metrics || {
                    totalBusiness: 0,
                    totalPaid: 0,
                    totalPending: 0,
                  };
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {client.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {client.company || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {client.phone || client.email || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatINR(metrics.totalBusiness)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(metrics.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                        {formatINR(metrics.totalPending)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              client.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {client.isActive ? 'Active' : 'Archived'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleClientArchive(client)}
                            title={client.isActive ? 'Archive client' : 'Restore client'}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
                          >
                            {client.isActive ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
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
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const metrics = client.metrics || {
              totalBusiness: 0,
              totalPaid: 0,
              totalPending: 0,
              projectCount: 0,
            };

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-5 rounded-2xl glass-panel glass-panel-hover cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{client.name}</h3>
                      {client.company && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-0.5 font-medium">
                          <Building className="w-3 h-3 text-indigo-500" />
                          <span>{client.company}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          client.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {client.isActive ? 'Active' : 'Archived'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleClientArchive(client);
                        }}
                        title={client.isActive ? 'Move to archived' : 'Restore to active'}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        {client.isActive ? (
                          <Archive className="w-3.5 h-3.5" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contact Snippets */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {client.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </p>
                    )}
                    {client.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Overview Metrics */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Total</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatINR(metrics.totalBusiness)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Paid</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatINR(metrics.totalPaid)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Pending</p>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatINR(metrics.totalPending)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Client Profile"
        subtitle="Centralized profile for projects, invoices, and contact info"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Client Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Company / Organization</label>
            <input
              type="text"
              placeholder="e.g. Apex Healthcare Pvt Ltd"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="client@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Office / Billing Address</label>
            <input
              type="text"
              placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Internal Notes</label>
            <textarea
              rows={3}
              placeholder="Key stakeholders, preferences, or referral background..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Client 360 Detail View Modal */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={selectedClient.name}
          subtitle={selectedClient.company ? `${selectedClient.company} • Client Profile` : 'Client Profile'}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Metrics Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Agreed</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                  {formatINR(selectedClient.metrics?.totalBusiness)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Paid</p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatINR(selectedClient.metrics?.totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Balance Due</p>
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {formatINR(selectedClient.metrics?.totalPending)}
                </p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Contact Information
              </h4>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Phone:</span> {selectedClient.phone || 'Not provided'}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Email:</span> {selectedClient.email || 'Not provided'}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Address:</span> {selectedClient.address || 'Not provided'}
              </p>
              {selectedClient.notes && (
                <p className="text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 italic">
                  {selectedClient.notes}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  await handleToggleClientArchive(selectedClient);
                  setSelectedClient((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedClient.isActive
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {selectedClient.isActive ? (
                  <>
                    <Archive className="w-3.5 h-3.5 text-amber-600" />
                    <span>Archive Client</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Restore Client</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
