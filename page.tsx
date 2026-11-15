"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "Not started" | "In progress" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Task = {
  id: string; title: string; description: string; category: string;
  startDate: string; dueDate: string; priority: Priority; status: Status; progress: number;
  createdAt: string;
};

const STORAGE_KEY = "taskflow-tasks-v1";
const today = () => new Date().toISOString().slice(0, 10);
const blankTask = {
  title: "", description: "", category: "Personal", startDate: today(),
  dueDate: "", priority: "Medium" as Priority, status: "Not started" as Status, progress: 0
};
const dateLabel = (value: string) => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No date";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blankTask);
  const [filter, setFilter] = useState("All tasks");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "timeline">("list");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTasks(JSON.parse(saved));
    } catch { /* Ignore invalid local browser data. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const completed = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "In progress").length;
  const overdue = tasks.filter(t => t.status !== "Completed" && t.dueDate && t.dueDate < today()).length;
  const overall = tasks.length ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0;

  const visibleTasks = useMemo(() => tasks
    .filter(t => filter === "All tasks" || (filter === "Overdue" ? t.status !== "Completed" && !!t.dueDate && t.dueDate < today() : t.status === filter))
    .filter(t => (t.title + " " + t.description + " " + t.category).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")), [tasks, filter, search]);

  function openNew() {
    setEditing(null); setForm(blankTask); setShowForm(true);
  }
  function openEdit(task: Task) {
    setEditing(task.id);
    setForm({ title: task.title, description: task.description, category: task.category, startDate: task.startDate, dueDate: task.dueDate, priority: task.priority, status: task.status, progress: task.progress });
    setShowForm(true);
  }
  function saveTask(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const normalized = { ...form, progress: form.status === "Completed" ? 100 : form.status === "Not started" && form.progress === 0 ? 0 : Math.min(99, Math.max(0, Number(form.progress))) };
    if (editing) setTasks(prev => prev.map(t => t.id === editing ? { ...t, ...normalized } : t));
    else setTasks(prev => [{ ...normalized, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev]);
    setShowForm(false); setEditing(null);
  }
  function updateProgress(task: Task, progress: number) {
    const value = Math.max(0, Math.min(100, progress));
    const status: Status = value === 100 ? "Completed" : value === 0 ? "Not started" : "In progress";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: value, status } : t));
  }
  function updateStatus(task: Task, status: Status) {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status, progress: status === "Completed" ? 100 : status === "Not started" ? 0 : Math.max(10, t.progress) } : t));
  }
  function removeTask(id: string) {
    if (window.confirm("Delete this task? This cannot be undone.")) setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark">✳</span><span>taskflow</span></a>
        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${filter === "All tasks" ? "active" : ""}`} onClick={() => setFilter("All tasks")}><span>▦</span> All tasks <b>{tasks.length}</b></button>
        <button className={`nav-item ${filter === "In progress" ? "active" : ""}`} onClick={() => setFilter("In progress")}><span>◷</span> In progress</button>
        <button className={`nav-item ${filter === "Completed" ? "active" : ""}`} onClick={() => setFilter("Completed")}><span>✓</span> Completed</button>
        <button className={`nav-item ${filter === "Overdue" ? "active" : ""}`} onClick={() => setFilter("Overdue")}><span>⚑</span> Overdue {overdue > 0 && <b className="alert-count">{overdue}</b>}</button>
        <div className="sidebar-bottom"><div className="mini-avatar">TF</div><div><strong>My workspace</strong><small>Personal account</small></div></div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{view === "timeline" ? "Timeline" : filter}</strong></div>
          <div className="top-actions"><span className="today-label">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span><button className="primary-btn" onClick={openNew}>＋ <span>New task</span></button></div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div><p className="eyebrow">YOUR OVERVIEW</p><h1>Good things get done.</h1><p className="subheading">A clear view of what matters and what’s next.</p></div>
            <div className="view-switch"><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")}>☷ List</button><button className={view === "timeline" ? "selected" : ""} onClick={() => setView("timeline")}>▤ Timeline</button></div>
          </div>

          <div className="stats-grid">
            <Stat label="Total tasks" value={tasks.length} note="In your workspace" icon="▦" tone="purple" />
            <Stat label="In progress" value={inProgress} note="Currently moving" icon="◷" tone="blue" />
            <Stat label="Completed" value={completed} note={tasks.length ? `${Math.round(completed / tasks.length * 100)}% of all tasks` : "Your wins show up here"} icon="✓" tone="green" />
            <Stat label="Overdue" value={overdue} note="Need your attention" icon="⚑" tone="orange" />
          </div>

          <section className="progress-panel">
            <div className="progress-copy"><div><span className="section-kicker">OVERALL PROGRESS</span><h2>Your momentum</h2><p>{tasks.length ? "Every small step moves a task forward." : "Add your first task to start tracking progress."}</p></div><strong>{overall}%</strong></div>
            <div className="big-progress"><span style={{ width: `${overall}%` }} /></div>
            <div className="progress-foot"><span>{completed} of {tasks.length} tasks completed</span><span>{tasks.length - completed} remaining</span></div>
          </section>

          <section className="tasks-section">
            <div className="section-header"><div><span className="section-kicker">{view === "timeline" ? "PLAN AHEAD" : "YOUR WORK"}</span><h2>{view === "timeline" ? "Task timeline" : filter}</h2></div><div className="task-tools"><div className="search-box"><span>⌕</span><input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} /></div><button className="outline-btn" onClick={openNew}>＋ Add task</button></div></div>
            {visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon">✳</div><h3>{search ? "No matching tasks" : "Nothing on your list yet"}</h3><p>{search ? "Try another search term." : "Create a task, set a deadline, and track your progress here."}</p>{!search && <button className="primary-btn" onClick={openNew}>＋ Create your first task</button>}</div> :
              view === "list" ? <div className="task-list">{visibleTasks.map(task => <TaskRow key={task.id} task={task} onEdit={openEdit} onDelete={removeTask} onProgress={updateProgress} onStatus={updateStatus} />)}</div> :
              <div className="timeline-list">{visibleTasks.map(task => <div className="timeline-row" key={task.id}><div className="timeline-date"><strong>{task.dueDate ? new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit" }) : "—"}</strong><span>{task.dueDate ? new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-IN", { month: "short" }) : "No date"}</span></div><div className="timeline-line"><i /></div><div className="timeline-card"><div><strong>{task.title}</strong><p>{task.category} · Starts {dateLabel(task.startDate)}</p></div><div className="timeline-meta"><StatusPill status={task.status} /><span>Due {dateLabel(task.dueDate)}</span></div></div></div>)}</div>
            }
          </section>
          <footer className="footer-note">Made for focus. One task at a time. <span>✳</span></footer>
        </div>
      </section>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><form className="task-modal" onSubmit={saveTask}>
        <div className="modal-head"><div><span className="section-kicker">{editing ? "UPDATE YOUR WORK" : "MAKE IT HAPPEN"}</span><h2>{editing ? "Edit task" : "Create a task"}</h2></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div>
        <label>Task name <input required autoFocus placeholder="e.g. Prepare project proposal" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label>Description <textarea placeholder="Add a few details about this task..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <div className="form-grid"><label>Category <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Personal</option><option>Work</option><option>Study</option><option>Health</option><option>Other</option></select></label><label>Priority <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
        <div className="form-grid"><label>Start date <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label><label>Due date <input type="date" min={form.startDate} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label></div>
        {editing && <><label>Status <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}><option>Not started</option><option>In progress</option><option>Completed</option></select></label><label>Progress <div className="range-line"><input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value), status: Number(e.target.value) === 100 ? "Completed" : Number(e.target.value) === 0 ? "Not started" : "In progress" })} /><strong>{form.progress}%</strong></div></label></>}
        <div className="modal-actions"><button type="button" className="outline-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" type="submit">{editing ? "Save changes" : "Create task"}</button></div>
      </form></div>}
      {!ready && <div className="loading-screen">Loading your workspace…</div>}
    </main>
  );
}

function Stat({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div>;
}
function StatusPill({ status }: { status: Status }) {
  return <span className={`status-pill ${status.toLowerCase().replace(" ", "-")}`}><i />{status}</span>;
}
function TaskRow({ task, onEdit, onDelete, onProgress, onStatus }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void; onProgress: (t: Task, p: number) => void; onStatus: (t: Task, s: Status) => void }) {
  const isOverdue = task.status !== "Completed" && !!task.dueDate && task.dueDate < today();
  return <article className="task-row">
    <div className="task-main"><div className="task-title-line"><h3>{task.title}</h3>{isOverdue && <span className="overdue-tag">Overdue</span>}</div>{task.description && <p className="task-description">{task.description}</p>}<div className="task-details"><span className="category-tag">{task.category}</span><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority} priority</span><span className="date-detail">◷ {dateLabel(task.dueDate)}</span></div></div>
    <div className="task-progress"><div className="progress-label"><span>Progress</span><strong>{task.progress}%</strong></div><div className="small-progress"><span style={{ width: `${task.progress}%` }} /></div><select aria-label={`Update status for ${task.title}`} value={task.status} onChange={e => onStatus(task, e.target.value as Status)}><option>Not started</option><option>In progress</option><option>Completed</option></select></div>
    <div className="task-actions"><button title="Edit task" onClick={() => onEdit(task)}>✎</button><button title="Delete task" onClick={() => onDelete(task.id)}>⌫</button></div>
  </article>;
}
