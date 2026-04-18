import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, User, Phone, IndianRupee, ChevronRight, X, TrendingDown, CheckCircle } from 'lucide-react';
import API from '../api/client';
import toast from 'react-hot-toast';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collecting, setCollecting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await API.get(`/customers?${params}`);
      setCustomers(res.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const openDetail = async (customer) => {
    setShowDetail(customer);
    try {
      const res = await API.get(`/customers/${customer._id}`);
      setDetailData(res.data);
    } catch { setDetailData({ customer, transactions: [] }); }
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      await API.post('/customers', form);
      toast.success('Customer added!');
      setShowModal(false);
      setForm(emptyForm);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleCollect = async () => {
    if (!collectAmount || parseFloat(collectAmount) <= 0) return toast.error('Enter valid amount');
    setCollecting(true);
    try {
      await API.post(`/customers/${showDetail._id}/collect`, { amount: parseFloat(collectAmount) });
      toast.success(`Payment collected!`);
      setCollectAmount('');
      openDetail(showDetail);
      fetchCustomers();
    } catch { toast.error('Failed to collect payment'); }
    finally { setCollecting(false); }
  };

  const totalUdhaar = customers.reduce((s, c) => s + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers (CRM) - Udhaar List</h2>
          <p className="page-subtitle text-muted">{customers.length} customers with pending balance · Total Udhaar: <span style={{ color: 'var(--danger)' }}>₹{totalUdhaar.toFixed(0)}</span></p>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mb-4" style={{ position: 'relative', maxWidth: '400px' }}>
        <Search className="search-icon" size={16} />
        <input id="cust-search" className="input" style={{ paddingLeft: '36px' }}
          placeholder="Search by name or phone..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Customers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {loading ? (
          <div className="loading-center" style={{ gridColumn: '1/-1' }}>
            <div className="spinner" /><span className="text-muted">Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <User size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No customers yet. Add your first customer!</p>
          </div>
        ) : customers.map((c) => (
          <div key={c._id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderLeft: c.balance < 0 ? '3px solid var(--danger)' : '3px solid var(--success)',
            }}
            onClick={() => openDetail(c)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = c.balance < 0 ? 'var(--danger)' : 'var(--success)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', color: 'white', fontWeight: 700,
                }}>
                  {c.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={11} /> {c.phone}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Balance</div>
                <div style={{
                  fontSize: '1rem', fontWeight: 800,
                  color: c.balance < 0 ? 'var(--danger)' : c.balance > 0 ? 'var(--success)' : 'var(--text-muted)',
                }}>
                  {c.balance < 0 ? `-₹${Math.abs(c.balance).toFixed(0)}` : c.balance > 0 ? `+₹${c.balance.toFixed(0)}` : '₹0'}
                </div>
                {c.balance < 0 && <div style={{ fontSize: '0.65rem', color: 'var(--danger)' }}>Udhaar</div>}
              </div>
              {c.last_visit && (
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <div>Last visit</div>
                  <div>{new Date(c.last_visit).toLocaleDateString('en-IN')}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>


      {/* Customer Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => { setShowDetail(null); setDetailData(null); }}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">👤 {showDetail.name}</h3>
              <button className="btn-icon btn btn-ghost" onClick={() => { setShowDetail(null); setDetailData(null); }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="card card-sm">
                  <div className="text-muted text-sm">Phone</div>
                  <div style={{ fontWeight: 600 }}>{showDetail.phone}</div>
                </div>
                <div className="card card-sm" style={{ borderLeft: `3px solid ${showDetail.balance < 0 ? 'var(--danger)' : 'var(--success)'}` }}>
                  <div className="text-muted text-sm">Balance</div>
                  <div style={{ fontWeight: 800, color: showDetail.balance < 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {showDetail.balance < 0 ? `Udhaar: ₹${Math.abs(showDetail.balance).toFixed(0)}` : `₹${showDetail.balance.toFixed(0)}`}
                  </div>
                </div>
              </div>

              {/* Collect Payment */}
              {showDetail.balance < 0 && (
                <div className="card card-sm mb-4" style={{ border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.05)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    💰 Collect Udhaar Payment
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="collect-amount"
                      className="input"
                      type="number"
                      placeholder={`Max ₹${Math.abs(showDetail.balance).toFixed(0)}`}
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                    />
                    <button id="collect-btn" className="btn btn-success" onClick={handleCollect} disabled={collecting}>
                      <CheckCircle size={15} /> {collecting ? '...' : 'Collect'}
                    </button>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px' }}>📋 Purchase History</h4>
                {detailData ? (
                  detailData.transactions.length === 0 ? (
                    <p className="text-muted text-sm">No transactions yet.</p>
                  ) : (
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {detailData.transactions.map((t) => (
                        <div key={t._id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem',
                        }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>#{t.invoice_number}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(t.created_at).toLocaleDateString('en-IN')} · {t.items.length} items · {t.payment_mode}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{t.final_amount.toFixed(0)}</div>
                            <span className={`badge badge-${t.status === 'paid' ? 'success' : t.status === 'partial' ? 'warning' : 'danger'}`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="loading-center" style={{ minHeight: '80px' }}>
                    <div className="spinner" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
