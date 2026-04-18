import { useState, useCallback } from 'react';
import { Plus, Trash2, X, Receipt } from 'lucide-react';
import API from '../api/client';
import toast from 'react-hot-toast';

const CATEGORIES = ['General', 'Rent', 'Electricity', 'Staff Salary', 'Transport', 'Purchase', 'Maintenance', 'Marketing', 'Other'];

export default function ExpensesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'General', note: '' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/expenses?from=${from}&to=${to}`);
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setLoaded(true);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [from, to]);

  const handleSave = async () => {
    if (!form.title || !form.amount) return toast.error('Title and amount are required');
    setSaving(true);
    try {
      await API.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense added!');
      setShowModal(false);
      setForm({ title: '', amount: '', category: 'General', note: '' });
      fetchExpenses();
    } catch { toast.error('Failed to save expense'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await API.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Expenses</h2>
          <p className="page-subtitle text-muted">Track daily business expenses</p>
        </div>
        <button id="add-expense-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Date Filter */}
      <div className="card card-sm mb-4" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '140px' }}>
          <label className="input-label">From</label>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: '140px' }}>
          <label className="input-label">To</label>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button id="load-expenses" className="btn btn-primary" onClick={fetchExpenses} style={{ marginTop: '20px' }}>
          Load Expenses
        </button>
      </div>

      {/* Summary */}
      {loaded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{total.toFixed(0)}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
            <div className="stat-label">No. of Entries</div>
            <div className="stat-value">{expenses.length}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
            <div className="stat-label">Avg per entry</div>
            <div className="stat-value">₹{expenses.length ? (total / expenses.length).toFixed(0) : 0}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-center" style={{ minHeight: 'auto' }}>
                    <div className="spinner" />
                  </div>
                </td></tr>
              ) : !loaded ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Select date range and click Load Expenses
                </td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Receipt size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                  No expenses in this period
                </td></tr>
              ) : expenses.map((e) => (
                <tr key={e._id}>
                  <td style={{ fontWeight: 600 }}>{e.title}</td>
                  <td><span className="badge badge-gray">{e.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{e.amount.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.note || '-'}</td>
                  <td>
                    <button className="btn-icon btn btn-ghost" onClick={() => handleDelete(e._id)}>
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">➕ Add Expense</h3>
              <button className="btn-icon btn btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input id="exp-title" className="input" placeholder="e.g. Electricity Bill"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Amount (₹) *</label>
                    <input id="exp-amount" className="input" type="number" placeholder="500"
                      value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Note (Optional)</label>
                  <input className="input" placeholder="Additional details" value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-expense" className="btn btn-danger" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '➕ Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
