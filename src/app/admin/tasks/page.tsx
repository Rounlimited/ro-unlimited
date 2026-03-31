'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, CheckCircle2, Circle, Clock, AlertCircle, ChevronRight,
  Trash2, Edit3, Bell, BellOff, RefreshCw, Tag, Link2,
  Building2, Truck, ClipboardList, Users, DollarSign, MapPin,
  X, Check, ChevronDown, Loader2, Calendar,
} from 'lucide-react';

type TaskStatus = 'pending' | 'in_progress' | 'done' | 'snoozed' | 'cancelled';
type TaskCategory = 'job_site' | 'customer' | 'vendor' | 'permit' | 'employee' | 'financial' | 'general';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  due_time?: string;
  remind_at?: string;
  reminder_sent: boolean;
  recurrence_type: string;
  linked_type?: string;
  linked_id?: string;
  linked_label?: string;
  notes?: string;
  tags?: string[];
  completed_at?: string;
  snoozed_until?: string;
  created_at: string;
}

const CATEGORY_CONFIG: Record<TaskCategory, { label: string; icon: any; color: string; bg: string }> = {
  job_site:  { label: 'Job Site',  icon: MapPin,        color: '#4C8BC9', bg: 'rgba(76,139,201,0.15)' },
  customer:  { label: 'Customer',  icon: Building2,     color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
  vendor:    { label: 'Vendor',    icon: Truck,         color: '#4CC97A', bg: 'rgba(76,201,122,0.15)' },
  permit:    { label: 'Permit',    icon: ClipboardList, color: '#D4772C', bg: 'rgba(212,119,44,0.15)' },
  employee:  { label: 'Employee',  icon: Users,         color: '#8B4CC9', bg: 'rgba(139,76,201,0.15)' },
  financial: { label: 'Financial', icon: DollarSign,    color: '#C94C6E', bg: 'rgba(201,76,110,0.15)' },
  general:   { label: 'General',   icon: Tag,           color: '#888',    bg: 'rgba(255,255,255,0.08)' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#555' },
  medium: { label: 'Medium', color: '#C9A84C' },
  high:   { label: 'High',   color: '#D4772C' },
  urgent: { label: 'Urgent', color: '#ef4444' },
};

const RECURRENCE_OPTIONS = [
  { value: 'none',     label: 'No repeat' },
  { value: 'daily',    label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekly',   label: 'Every week' },
  { value: 'monthly',  label: 'Every month' },
];

const REMINDER_OPTIONS = [
  { value: null,  label: 'No reminder' },
  { value: 0,     label: 'At due time' },
  { value: 15,    label: '15 min before' },
  { value: 30,    label: '30 min before' },
  { value: 60,    label: '1 hour before' },
  { value: 1440,  label: '1 day before' },
];

type TabId = 'today' | 'upcoming' | 'all';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(t?: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') return false;
  const today = new Date().toISOString().split('T')[0];
  return task.due_date < today;
}

// ── Task Card ──
function TaskCard({ task, onComplete, onDelete, onEdit, onSnooze }: {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSnooze: (task: Task) => void;
}) {
  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.general;
  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const CatIcon = cat.icon;
  const overdue = isOverdue(task);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(task.id);
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
      task.status === 'done'
        ? 'bg-white/3 border-white/5 opacity-40'
        : overdue
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-[#111] border-white/8 hover:border-white/15'
    }`}>
      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={completing || task.status === 'done'}
        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          task.status === 'done'
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-white/20 hover:border-[#C9A84C] hover:bg-[#C9A84C]/10'
        }`}
      >
        {completing ? <Loader2 size={12} className="animate-spin text-[#C9A84C]" /> :
         task.status === 'done' ? <Check size={12} /> : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[15px] font-medium leading-snug ${task.status === 'done' ? 'line-through text-white/30' : 'text-white'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(task)} className="p-1.5 text-white/20 hover:text-white/60 rounded-lg transition-colors">
              <Edit3 size={13} />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 text-white/20 hover:text-red-400 rounded-lg transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-[13px] text-white/40 mt-0.5 leading-snug">{task.description}</p>
        )}

        <div className="flex items-center flex-wrap gap-1.5 mt-2">
          {/* Category */}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: cat.bg, color: cat.color }}>
            <CatIcon size={10} />
            {cat.label}
          </span>

          {/* Priority (only show high/urgent) */}
          {(task.priority === 'high' || task.priority === 'urgent') && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: pri.color + '22', color: pri.color }}>
              {pri.label}
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-400 font-semibold' : 'text-white/30'}`}>
              <Clock size={10} />
              {overdue && '⚠️ '}
              {formatDate(task.due_date)}
              {task.due_time && ` · ${formatTime(task.due_time)}`}
            </span>
          )}

          {/* Linked entity */}
          {task.linked_label && (
            <span className="flex items-center gap-1 text-[11px] text-white/25">
              <Link2 size={10} />
              {task.linked_label}
            </span>
          )}

          {/* Recurrence */}
          {task.recurrence_type && task.recurrence_type !== 'none' && (
            <span className="flex items-center gap-1 text-[11px] text-[#4C8BC9]/60">
              <RefreshCw size={10} />
              {task.recurrence_type}
            </span>
          )}

          {/* Reminder */}
          {task.remind_at && !task.reminder_sent && (
            <span className="flex items-center gap-1 text-[11px] text-[#C9A84C]/50">
              <Bell size={10} />
            </span>
          )}
        </div>

        {/* Snooze button for overdue */}
        {overdue && task.status !== 'done' && (
          <button
            onClick={() => onSnooze(task)}
            className="mt-2 text-[12px] text-white/30 hover:text-[#C9A84C] transition-colors"
          >
            Snooze →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add/Edit Task Modal ──
function TaskModal({ task, onSave, onClose }: {
  task?: Task | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState<TaskCategory>(task?.category || 'general');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [dueTime, setDueTime] = useState(task?.due_time || '');
  const [reminderMins, setReminderMins] = useState<number | null>(null);
  const [recurrence, setRecurrence] = useState(task?.recurrence_type || 'none');
  const [notes, setNotes] = useState(task?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      due_date: dueDate || undefined,
      due_time: dueTime || undefined,
      remind_minutes_before: reminderMins,
      recurrence_type: recurrence,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#0f0f0f] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-[#0f0f0f] z-10">
          <h2 className="text-[17px] font-semibold text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Title */}
          <div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              autoFocus
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-[16px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[12px] text-white/40 mb-2 block uppercase tracking-wide">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all text-[11px] font-medium ${
                      category === cat ? 'border-current' : 'border-white/8 text-white/30 hover:text-white/50'
                    }`}
                    style={category === cat ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + '60' } : {}}>
                    <Icon size={16} />
                    {cfg.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[12px] text-white/40 mb-2 block uppercase tracking-wide">Priority</label>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                      priority === p ? 'border-current' : 'border-white/8 text-white/30'
                    }`}
                    style={priority === p ? { background: cfg.color + '22', color: cfg.color, borderColor: cfg.color + '60' } : {}}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-white/40 mb-1.5 block uppercase tracking-wide">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px] focus:outline-none focus:border-[#C9A84C]/50"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/40 mb-1.5 block uppercase tracking-wide">Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px] focus:outline-none focus:border-[#C9A84C]/50"
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="text-[12px] text-white/40 mb-1.5 block uppercase tracking-wide">Reminder</label>
            <select
              value={reminderMins ?? ''}
              onChange={e => setReminderMins(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px] focus:outline-none focus:border-[#C9A84C]/50"
            >
              {REMINDER_OPTIONS.map(o => (
                <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Repeat */}
          <div>
            <label className="text-[12px] text-white/40 mb-1.5 block uppercase tracking-wide">Repeat</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px] focus:outline-none focus:border-[#C9A84C]/50"
            >
              {RECURRENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] text-white/40 mb-1.5 block uppercase tracking-wide">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any extra details..."
              rows={2}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-[14px] placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 resize-none"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-black transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}
          >
            {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Snooze Modal ──
function SnoozeModal({ task, onSnooze, onClose }: { task: Task; onSnooze: (id: string, until: string) => void; onClose: () => void }) {
  const now = new Date();
  const options = [
    { label: 'Tomorrow morning', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0) },
    { label: 'This weekend',     date: (() => { const d = new Date(now); d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(9, 0); return d; })() },
    { label: 'Next Monday',      date: (() => { const d = new Date(now); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(8, 0); return d; })() },
    { label: 'In 2 weeks',       date: new Date(now.getTime() + 14 * 86400000) },
  ];

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-t-3xl p-5 pb-8" onClick={e => e.stopPropagation()}>
        <p className="text-[14px] text-white/40 mb-3">Snooze "{task.title.slice(0, 40)}"</p>
        <div className="space-y-2">
          {options.map(o => (
            <button key={o.label} onClick={() => onSnooze(task.id, o.date.toISOString())}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[15px] transition-colors">
              {o.label}
              <span className="text-white/30 text-[13px]">{o.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('today');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [snoozeTask, setSnoozeTask] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/admin/tasks?status=all&limit=200');
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const completeTask = async (id: string) => {
    await fetch(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t));
    showToast('✓ Task completed');
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hard: true }) });
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Task deleted');
  };

  const snoozeTask_ = async (id: string, snoozedUntil: string) => {
    await fetch(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'snoozed', snoozed_until: snoozedUntil }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'snoozed', snoozed_until: snoozedUntil } : t));
    setSnoozeTask(null);
    showToast('Task snoozed');
  };

  const saveTask = async (data: any) => {
    if (editTask) {
      const res = await fetch(`/api/admin/tasks/${editTask.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) { const d = await res.json(); setTasks(prev => prev.map(t => t.id === editTask.id ? d.task : t)); }
    } else {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) { const d = await res.json(); setTasks(prev => [d.task, ...prev]); }
    }
    setShowModal(false);
    setEditTask(null);
    showToast(editTask ? 'Task updated' : '✓ Task added');
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const activeTasks = tasks.filter(t => !['done', 'cancelled', 'snoozed'].includes(t.status));
  const overdueTasks = activeTasks.filter(t => t.due_date && t.due_date < today);
  const todayTasks = activeTasks.filter(t => t.due_date === today);
  const upcomingTasks = activeTasks.filter(t => t.due_date && t.due_date > today && t.due_date <= weekFromNow);
  const laterTasks = activeTasks.filter(t => !t.due_date || t.due_date > weekFromNow);
  const doneTasks = tasks.filter(t => t.status === 'done');

  const tabTasks: Task[] = tab === 'today'
    ? [...overdueTasks, ...todayTasks]
    : tab === 'upcoming'
      ? upcomingTasks
      : [...overdueTasks, ...todayTasks, ...upcomingTasks, ...laterTasks];

  const todayBadge = overdueTasks.length + todayTasks.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminHeader title="Tasks & Reminders" subtitle="Your daily command center" backHref="/admin" />

      <div className="max-w-2xl mx-auto px-4 pb-32">

        {/* Tabs */}
        <div className="flex gap-1 mt-4 mb-5 bg-white/5 rounded-2xl p-1">
          {([
            { id: 'today',    label: 'Today',    badge: todayBadge },
            { id: 'upcoming', label: 'This Week', badge: 0 },
            { id: 'all',      label: 'All Tasks', badge: 0 },
          ] as { id: TabId; label: string; badge: number }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                tab === t.id ? 'bg-[#C9A84C] text-black' : 'text-white/40 hover:text-white/60'
              }`}>
              {t.label}
              {t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  tab === t.id ? 'bg-black/20 text-black' : 'bg-red-500 text-white'
                }`}>{t.badge > 9 ? '9+' : t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-white/20" />
          </div>
        ) : tabTasks.length === 0 && !showDone ? (
          <div className="text-center py-16">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-[#C9A84C]/20" />
            <p className="text-white/40 text-[16px]">
              {tab === 'today' ? "All clear! Nothing due today." : tab === 'upcoming' ? "Nothing coming up this week." : "No tasks yet."}
            </p>
            <p className="text-white/20 text-[14px] mt-1">Tap + to add one, or ask the AI assistant.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Overdue section */}
            {tab !== 'upcoming' && overdueTasks.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 mt-2 mb-1">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-[12px] font-semibold text-red-400 uppercase tracking-wide">Overdue · {overdueTasks.length}</span>
                </div>
                {overdueTasks.map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} onEdit={t => { setEditTask(t); setShowModal(true); }} onSnooze={setSnoozeTask} />
                ))}
              </>
            )}

            {/* Today section */}
            {tab !== 'upcoming' && todayTasks.length > 0 && (
              <>
                {overdueTasks.length > 0 && <div className="flex items-center gap-2 px-1 mt-4 mb-1">
                  <Clock size={14} className="text-[#C9A84C]" />
                  <span className="text-[12px] font-semibold text-[#C9A84C] uppercase tracking-wide">Today · {todayTasks.length}</span>
                </div>}
                {todayTasks.map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} onEdit={t => { setEditTask(t); setShowModal(true); }} onSnooze={setSnoozeTask} />
                ))}
              </>
            )}

            {/* Upcoming this week */}
            {(tab === 'upcoming' || tab === 'all') && upcomingTasks.length > 0 && (
              <>
                {tab === 'all' && <div className="flex items-center gap-2 px-1 mt-4 mb-1">
                  <Calendar size={14} className="text-white/30" />
                  <span className="text-[12px] font-semibold text-white/30 uppercase tracking-wide">This Week · {upcomingTasks.length}</span>
                </div>}
                {upcomingTasks.map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} onEdit={t => { setEditTask(t); setShowModal(true); }} onSnooze={setSnoozeTask} />
                ))}
              </>
            )}

            {/* Later / no due date */}
            {tab === 'all' && laterTasks.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 mt-4 mb-1">
                  <Circle size={14} className="text-white/20" />
                  <span className="text-[12px] font-semibold text-white/20 uppercase tracking-wide">Later / No Due Date · {laterTasks.length}</span>
                </div>
                {laterTasks.map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} onEdit={t => { setEditTask(t); setShowModal(true); }} onSnooze={setSnoozeTask} />
                ))}
              </>
            )}

            {/* Completed toggle */}
            {doneTasks.length > 0 && (tab === 'all' || (tab === 'today' && doneTasks.filter(t => t.completed_at?.startsWith(today)).length > 0)) && (
              <>
                <button onClick={() => setShowDone(v => !v)}
                  className="flex items-center gap-2 w-full px-1 mt-5 py-2 text-white/20 hover:text-white/40 transition-colors">
                  <CheckCircle2 size={14} />
                  <span className="text-[12px] font-semibold uppercase tracking-wide">Completed · {doneTasks.length}</span>
                  <ChevronDown size={14} className={`ml-auto transition-transform ${showDone ? 'rotate-180' : ''}`} />
                </button>
                {showDone && doneTasks.map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} onEdit={t => { setEditTask(t); setShowModal(true); }} onSnooze={setSnoozeTask} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => { setEditTask(null); setShowModal(true); }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', boxShadow: '0 4px 24px rgba(201,168,76,0.4)' }}
      >
        <Plus size={24} className="text-black" />
      </button>

      {/* Modals */}
      {showModal && (
        <TaskModal
          task={editTask}
          onSave={saveTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
      {snoozeTask && (
        <SnoozeModal task={snoozeTask} onSnooze={snoozeTask_} onClose={() => setSnoozeTask(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-[14px] font-semibold text-black shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
