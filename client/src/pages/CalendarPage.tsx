import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CalendarEvent, EventType } from '../types';
import { formatDate, formatTime } from '../lib/formatters';
import { Modal } from '../components/common/Modal';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Event Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('MEETING');
  const [startAt, setStartAt] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [notes, setNotes] = useState('');

  const loadEvents = async () => {
    setIsLoading(true);
    const data = await api.getEvents();
    setEvents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt) return;

    await api.createEvent({
      title,
      type,
      startAt: new Date(startAt).toISOString(),
      allDay,
      notes,
    });

    setIsCreateOpen(false);
    setTitle('');
    setStartAt('');
    setNotes('');
    loadEvents();
  };

  const typeConfig: Record<EventType, { bg: string; text: string; border: string }> = {
    MEETING: { bg: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/30' },
    FOLLOW_UP: { bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30' },
    PAYMENT: { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
    TASK: { bg: 'bg-sky-50 dark:bg-sky-500/15', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-500/30' },
    DEADLINE: { bg: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/30' },
    OTHER: { bg: 'bg-slate-100 dark:bg-slate-700/30', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Master Schedule & Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Meetings, client follow-ups, payment milestones, and deadlines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* View switcher */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-xs">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                  activeView === view
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="interactive-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Events Stream / Agenda View */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel">
          <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No events scheduled</p>
          <p className="text-xs text-slate-400 mt-1">Schedule your first client meeting or deadline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => {
            const cfg = typeConfig[evt.type] || typeConfig.OTHER;
            return (
              <div
                key={evt.id}
                className="p-5 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {evt.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {evt.allDay ? 'All Day' : formatTime(evt.startAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 tracking-tight">{evt.title}</h3>
                  {evt.client && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-1 font-medium">
                      <Building className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{evt.client.name}</span>
                    </p>
                  )}
                  {evt.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{evt.notes}</p>}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(evt.startAt)}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    {evt.reminderMinutes ? `${evt.reminderMinutes}m reminder` : 'No reminder'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Event"
        subtitle="Unify client calls, demos, deadlines, and internal tasks"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint Demo with Apex Healthcare"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Event Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="MEETING">Meeting</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="PAYMENT">Payment Due</option>
                <option value="TASK">Task</option>
                <option value="DEADLINE">Deadline</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Agenda & Notes</label>
            <textarea
              rows={3}
              placeholder="Meeting link, agenda items, key talking points..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Save Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
