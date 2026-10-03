import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Lead, LeadStatus, ProjectType } from '../types';
import { formatINR, formatDate } from '../lib/formatters';
import { Modal } from '../components/common/Modal';
import {
  Compass,
  Plus,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Building,
  Calendar,
  GripVertical,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

const STAGES: {
  key: LeadStatus;
  label: string;
  columnClass: string;
  badgeClass: string;
}[] = [
  {
    key: 'NEW',
    label: 'New Lead',
    columnClass: 'bg-slate-50/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80',
    badgeClass: 'text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  },
  {
    key: 'CONTACTED',
    label: 'Contacted',
    columnClass: 'bg-sky-50/50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-500/20',
    badgeClass: 'text-sky-700 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-900/50 border-sky-200 dark:border-sky-700/50',
  },
  {
    key: 'DISCUSSION',
    label: 'Discussion',
    columnClass: 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-500/20',
    badgeClass: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-700/50',
  },
  {
    key: 'PROPOSAL_SENT',
    label: 'Proposal Sent',
    columnClass: 'bg-purple-50/50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-500/20',
    badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700/50',
  },
  {
    key: 'NEGOTIATION',
    label: 'Negotiation',
    columnClass: 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-500/20',
    badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/50 border-amber-200 dark:border-amber-700/50',
  },
  {
    key: 'WON',
    label: 'Won Deal',
    columnClass: 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/20',
    badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700/50',
  },
];

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Drag and drop states
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const [mobileActiveStage, setMobileActiveStage] = useState<string>('ALL');

  // New Lead Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Website');
  const [service, setService] = useState<ProjectType>('WEBSITE');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [notes, setNotes] = useState('');

  // 1-Click Convert Lead to Client Modal
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [projName, setProjName] = useState('');
  const [projValue, setProjValue] = useState('');

  const loadLeads = async () => {
    setIsLoading(true);
    const data = await api.getLeads();
    setLeads(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDragOverStage(null);
    setDraggedLeadId(null);

    if (leadId) {
      await handleMoveLead(leadId, targetStage);
    }
  };

  // Move Lead Status
  const handleMoveLead = async (leadId: string, newStage: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStage) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStage } : l))
    );

    try {
      await api.updateLead(leadId, { status: newStage });
      if (newStage === 'WON') {
        openConvertModal({ ...lead, status: 'WON' });
      }
    } catch (error) {
      console.error('Failed to move lead:', error);
      loadLeads();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await api.createLead({
      name,
      company,
      phone,
      email,
      source,
      interestedService: service,
      estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
      nextFollowUpAt: nextFollowUp || undefined,
      notes,
    });

    setIsCreateOpen(false);
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setEstimatedValue('');
    loadLeads();
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    await api.convertLeadToClient(
      convertingLead.id,
      projName || undefined,
      projValue ? Number(projValue) : undefined
    );

    setConvertingLead(null);
    setProjName('');
    setProjValue('');
    loadLeads();
  };

  const openConvertModal = (lead: Lead) => {
    setConvertingLead(lead);
    setProjName(`${lead.name} - Initial Deliverables`);
    setProjValue(lead.estimatedValue ? String(lead.estimatedValue) : '');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Leads & CRM Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag inquiries across pipeline stages or convert won deals into active clients
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="interactive-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Visual Instruction Banner (Responsive) */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300">
        <div className="hidden lg:flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Drag & Drop:</strong> Drag any card to move between stages. Moving to "Won Deal" instantly opens the Client Converter.
          </span>
        </div>
        <div className="flex lg:hidden items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Quick Move:</strong> Tap "Move" on any lead card to instantly change its pipeline stage without dragging.
          </span>
        </div>
      </div>

      {/* Mobile Pipeline Stage Filter Tabs (Visible on mobile only) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setMobileActiveStage('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileActiveStage === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          All Stages ({leads.length})
        </button>
        {STAGES.map((s) => {
          const count = leads.filter((l) => l.status === s.key).length;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setMobileActiveStage(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mobileActiveStage === s.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Pipeline Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 pb-4 items-start">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const stageTotal = stageLeads.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);
          const isOver = dragOverStage === stage.key;
          const isMobileHidden = mobileActiveStage !== 'ALL' && mobileActiveStage !== stage.key;

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`${isMobileHidden ? 'hidden lg:flex' : 'flex'} p-3 rounded-2xl border transition-all duration-150 flex-col justify-between min-h-0 lg:min-h-[500px] ${
                stage.columnClass
              } ${
                isOver
                  ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/40 scale-[1.01]'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-white tracking-tight truncate pr-1">
                    {stage.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${stage.badgeClass}`}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Subtitle Value for Uniform Vertical Alignment */}
                <div className="pt-1.5 h-6 flex items-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {stageTotal > 0 ? formatINR(stageTotal) : '₹0'}
                  </span>
                </div>

                {/* Drop Zone Placeholder */}
                {isOver && (
                  <div className="mt-2.5 p-2 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-center">
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Drop here</p>
                  </div>
                )}

                {/* Lead Cards List */}
                <div className="mt-2 space-y-2">
                  {stageLeads.length === 0 && !isOver && (
                    <div className="h-14 lg:h-28 rounded-xl border border-dashed border-slate-200/90 dark:border-slate-800/90 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 select-none">
                      <span className="text-[11px] font-medium">No leads</span>
                    </div>
                  )}
                  {stageLeads.map((lead) => {
                    const isDragging = draggedLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all space-y-1.5 cursor-grab active:cursor-grabbing select-none shadow-xs ${
                          isDragging
                            ? 'opacity-40 scale-95 border-dashed border-indigo-500'
                            : 'hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Title and Grip Icon */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {lead.name}
                            </h4>
                            {lead.company && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{lead.company}</span>
                              </p>
                            )}
                          </div>
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 hidden lg:block" />
                        </div>

                        {/* Estimated Value */}
                        {lead.estimatedValue && (
                          <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{formatINR(lead.estimatedValue)}</p>
                        )}

                        {/* Follow-up Date */}
                        {lead.nextFollowUpAt && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap overflow-hidden">
                            <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{formatDate(lead.nextFollowUpAt)}</span>
                          </div>
                        )}

                        {/* Mobile Quick Move Stage Selector */}
                        <div className="lg:hidden pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Move:</span>
                          <div className="relative flex-1 max-w-[170px]">
                            <select
                              value={lead.status}
                              onChange={(e) => handleMoveLead(lead.id, e.target.value as LeadStatus)}
                              className="w-full text-[11px] font-semibold py-1 pl-2.5 pr-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Convert to Client Button */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          {lead.status !== 'WON' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConvertModal(lead);
                              }}
                              className="w-full py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Convert to Client</span>
                            </button>
                          ) : (
                            <div className="w-full py-0.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Won Deal</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Prospective Lead"
        subtitle="Inquiries will be tracked across pipeline stages and follow-up schedules"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lead Contact Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Venkatesh Iyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
            <input
              type="text"
              placeholder="e.g. Iyer Superfoods"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="lead@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
                <option value="Social media">Social Media</option>
                <option value="Cold outreach">Cold Outreach</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Value (INR)</label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
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
              Add Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* 1-Click Convert Lead to Client Modal */}
      {convertingLead && (
        <Modal
          isOpen={!!convertingLead}
          onClose={() => setConvertingLead(null)}
          title={`Convert "${convertingLead.name}" to Active Client`}
          subtitle="Creates central client profile, links follow-ups, marks Won, and initializes the first project"
        >
          <form onSubmit={handleConvert} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              ✓ Client profile will be created with zero re-typing.
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Project Name</label>
              <input
                type="text"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Total Project Value (INR)</label>
              <input
                type="number"
                value={projValue}
                onChange={(e) => setProjValue(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConvertingLead(null)}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-all"
              >
                Confirm & Launch Project
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
