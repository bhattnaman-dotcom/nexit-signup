'use client';

import { useState } from 'react';

interface StaffRow {
  id: number;
  name: string;
  email: string;
  created_at: string;
  agreement_count: number;
}

export default function StaffManager({ initialStaff }: { initialStaff: StaffRow[] }) {
  const [staff, setStaff] = useState<StaffRow[]>(initialStaff);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ name: '', email: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexit-navy/30 focus:border-nexit-navy transition-colors';

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add');
      setStaff((prev) => [...prev, { ...data, created_at: new Date().toISOString(), agreement_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm({ name: '', email: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: StaffRow) {
    setEditingId(s.id);
    setEditForm({ name: s.name, email: s.email });
    setError('');
  }

  async function handleEdit(id: number) {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update');
      setStaff((prev) =>
        prev.map((s) => s.id === id ? { ...s, name: editForm.name, email: editForm.email } : s)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: StaffRow) {
    if (!confirm(`Remove ${s.name} from the staff directory? Their existing agreements are not affected.`)) return;
    setDeleting(s.id);
    try {
      const res = await fetch(`/api/admin/staff/${s.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Failed to delete'); return; }
      setStaff((prev) => prev.filter((m) => m.id !== s.id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add button / form */}
      {!showAddForm ? (
        <button
          onClick={() => { setShowAddForm(true); setError(''); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-nexit-orange hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Staff Member
        </button>
      ) : (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">New Staff Member</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                autoFocus
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
                placeholder="jane@nexit.com.au"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-nexit-orange hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      )}

      {/* Error banner for edit */}
      {error && editingId !== null && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Staff list */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-400 text-sm">No staff members yet. Add one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {staff.length} Staff Member{staff.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ul className="divide-y divide-gray-50">
            {staff.map((s) => (
              <li key={s.id} className="px-6 py-4">
                {editingId === s.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className={inputClass}
                    />
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        onClick={() => handleEdit(s.id)}
                        disabled={saving}
                        className="px-4 py-1.5 bg-nexit-navy text-white rounded-lg text-sm font-semibold hover:bg-nexit-navy-light transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setError(''); }}
                        className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-nexit-navy flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-nexit-dark truncate">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="hidden sm:inline text-xs text-gray-400">
                        {s.agreement_count} agreement{s.agreement_count !== 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-xs font-medium text-nexit-navy hover:text-nexit-navy-light underline-offset-2 hover:underline transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deleting === s.id}
                          className="text-xs font-medium text-red-500 hover:text-red-700 underline-offset-2 hover:underline transition-colors disabled:opacity-50"
                        >
                          {deleting === s.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
