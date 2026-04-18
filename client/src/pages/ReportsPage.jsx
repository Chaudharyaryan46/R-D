import { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import API from '../api/client';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const tooltipStyle = {
  backgroundColor: '#1a1a2e',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#f1f5f9',
  fontSize: '12px',
};

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, txRes, expRes] = await Promise.all([
        API.get('/dashboard'),
        API.get(`/transactions?from=${from}&to=${to}&limit=100`),
        API.get(`/expenses?from=${from}&to=${to}`),
      ]);

      const txs = txRes.data.transactions;
      const exps = expRes.data.expenses;

      // Build product map
      const productMap = {};
      txs.forEach((t) => {
        t.items.forEach((item) => {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          productMap[item.name].quantity += item.quantity;
          productMap[item.name].revenue += item.total_price;
        });
      });

      const totalSales = txs.reduce((s, t) => s + t.final_amount, 0);
      const totalExpenses = exps.reduce((s, e) => s + e.amount, 0);
      const totalOrders = txs.length;

      const paymentSplit = { cash: 0, upi: 0, card: 0 };
      txs.forEach((t) => {
        if (t.payment_mode === 'split') {
          t.split_payments.forEach((sp) => { paymentSplit[sp.mode] = (paymentSplit[sp.mode] || 0) + sp.amount; });
        } else {
          paymentSplit[t.payment_mode] = (paymentSplit[t.payment_mode] || 0) + t.final_amount;
        }
      });

      // Day-by-day breakdown
      const dayMap = {};
      txs.forEach((t) => {
        const day = new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (!dayMap[day]) dayMap[day] = { day, sales: 0, orders: 0 };
        dayMap[day].sales += t.final_amount;
        dayMap[day].orders += 1;
      });

      setData({
        totalSales, totalOrders, totalExpenses,
        netProfit: totalSales - totalExpenses,
        paymentSplit,
        topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
        dailyData: Object.values(dayMap),
        paymentPieData: Object.entries(paymentSplit).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k.toUpperCase(), value: v })),
      });
      setTransactions(txs);
    } catch (err) {
      toast.error('Failed to load report');
    } finally { setLoading(false); }
  }, [from, to]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle text-muted">Sales, expenses, and performance overview</p>
        </div>
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
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Today', fn: () => { setFrom(today); setTo(today); } },
            { label: 'Yesterday', fn: () => { const d = new Date(); d.setDate(d.getDate()-1); const s = d.toISOString().split('T')[0]; setFrom(s); setTo(s); } },
            { label: 'This Week', fn: () => { const d = new Date(); d.setDate(d.getDate()-6); setFrom(d.toISOString().split('T')[0]); setTo(today); } },
            { label: 'This Month', fn: () => { const d = new Date(); setFrom(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`); setTo(today); } },
          ].map(({ label, fn }) => (
            <button key={label} className="btn btn-ghost btn-sm" onClick={fn}>{label}</button>
          ))}
        </div>
        <button id="load-report" className="btn btn-primary" onClick={fetchReport} style={{ marginTop: '20px' }} disabled={loading}>
          {loading ? 'Loading...' : '📊 Generate Report'}
        </button>
      </div>

      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <p className="text-muted">Generating report...</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary Stats */}
          <div className="stats-grid mb-6">
            <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="stat-label">Total Sales</div>
              <div className="stat-value" style={{ color: 'var(--primary-light)' }}>₹{fmt(data.totalSales)}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--secondary)' }}>
              <div className="stat-label">Total Orders</div>
              <div className="stat-value" style={{ color: 'var(--secondary)' }}>{data.totalOrders}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{fmt(data.totalExpenses)}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: `3px solid ${data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <div className="stat-label">Net Profit</div>
              <div className="stat-value" style={{ color: data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ₹{fmt(data.netProfit)}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Daily Sales */}
            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px' }}>📅 Daily Sales</h3>
              {data.dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${fmt(v)}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'sales' ? `₹${fmt(v)}` : v, n === 'sales' ? 'Sales' : 'Orders']} />
                    <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="sales" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="loading-center" style={{ minHeight: '220px' }}>
                  <p className="text-muted text-sm">No sales in this period</p>
                </div>
              )}
            </div>

            {/* Payment Split Pie */}
            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px' }}>💳 Payment Methods</h3>
              {data.paymentPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={data.paymentPieData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                        {data.paymentPieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${fmt(v)}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {data.paymentPieData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                        <span>{d.name}: ₹{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="loading-center" style={{ minHeight: '200px' }}>
                  <p className="text-muted text-sm">No data</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="card mb-4">
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px' }}>🔥 Top Selling Products</h3>
            {data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${fmt(v)}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${fmt(v)}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted text-sm">No product data</p>}
          </div>

          {/* Transactions Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 0', fontWeight: 700, fontSize: '0.9rem' }}>📋 Transactions ({transactions.length})</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 30).map((t) => (
                    <tr key={t._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                        {t.invoice_number}
                      </td>
                      <td>{t.customer_name || <span className="text-muted">Walk-in</span>}</td>
                      <td><span className="badge badge-gray">{t.items.length} items</span></td>
                      <td style={{ fontWeight: 700 }}>₹{t.final_amount.toFixed(0)}</td>
                      <td><span className="badge badge-info">{t.payment_mode}</span></td>
                      <td>
                        <span className={`badge badge-${t.status === 'paid' ? 'success' : t.status === 'partial' ? 'warning' : 'danger'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
