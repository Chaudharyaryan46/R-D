import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, IndianRupee, AlertTriangle, Banknote, CreditCard, Smartphone } from 'lucide-react';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const { business } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await API.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    // Socket.IO real-time updates
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    if (business?.id) {
      socket.emit('join_business', business.id);
    }
    socket.on('new_transaction', () => {
      fetchDashboard();
    });
    return () => socket.disconnect();
  }, [business?.id, fetchDashboard]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  const paymentPieData = [
    { name: 'Cash', value: data?.paymentSplit?.cash || 0 },
    { name: 'UPI', value: data?.paymentSplit?.upi || 0 },
    { name: 'Card', value: data?.paymentSplit?.card || 0 },
  ].filter((d) => d.value > 0);

  const customTooltipStyle = {
    backgroundColor: '#1a1a2e',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#f1f5f9',
    fontSize: '12px',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle text-muted">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchDashboard}>↻ Refresh</button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<IndianRupee size={20} />}
          color="var(--primary)"
          value={`₹${fmt(data?.totalSales)}`}
          label="Today's Sales"
          bgColor="rgba(99,102,241,0.15)"
        />
        <StatCard
          icon={<ShoppingBag size={20} />}
          color="var(--secondary)"
          value={data?.totalOrders}
          label="Total Orders"
          bgColor="rgba(14,165,233,0.15)"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          color="var(--success)"
          value={`₹${fmt(data?.netProfit)}`}
          label="Net Profit"
          bgColor="rgba(34,197,94,0.15)"
        />
        <StatCard
          icon={<Users size={20} />}
          color="var(--warning)"
          value={data?.totalCustomers}
          label="Total Customers"
          bgColor="rgba(245,158,11,0.15)"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Weekly Sales */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>📈 Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.weeklySales || []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${fmt(v)}`} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`₹${fmt(v)}`, 'Sales']} />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#salesGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Split */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>💳 Payment Split</h3>
          {paymentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {paymentPieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`₹${fmt(v)}`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading-center" style={{ minHeight: '200px' }}>
              <p className="text-muted text-sm">No transactions today yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Mode Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <PaymentModeCard icon={<Banknote size={16} />} mode="Cash" amount={data?.paymentSplit?.cash} color="var(--success)" />
        <PaymentModeCard icon={<Smartphone size={16} />} mode="UPI" amount={data?.paymentSplit?.upi} color="var(--primary)" />
        <PaymentModeCard icon={<CreditCard size={16} />} mode="Card" amount={data?.paymentSplit?.card} color="var(--secondary)" />
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Top Products */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px' }}>🔥 Top Products</h3>
          {data?.topProducts?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS[i], background: `${COLORS[i]}20`, width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>₹{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No sales today</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px' }}>
            <span style={{ color: 'var(--warning)' }}>⚠️</span> Low Stock
          </h3>
          {data?.lowStockItems?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.lowStockItems.slice(0, 6).map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>{item.name}</span>
                  <span className="badge badge-warning">{item.stock} {item.unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">All items well-stocked ✅</p>
          )}
        </div>

        {/* Udhaar List */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px' }}>
            <span style={{ color: 'var(--danger)' }}>📋</span> Udhaar (Pending)
          </h3>
          {data?.udhaars?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.udhaars.map((c) => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                  </div>
                  <span className="badge badge-danger">₹{fmt(Math.abs(c.balance))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No pending udhaar 🎉</p>
          )}
        </div>
      </div>

      {/* Hourly Sales Bar Chart */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>⏰ Today's Hourly Sales</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={(data?.hourlySales || []).filter(h => {
            const hr = parseInt(h.hour);
            return hr >= 6 && hr <= 22;
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `₹${fmt(v)}`} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`₹${fmt(v)}`, 'Sales']} />
            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ icon, color, value, label, bgColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: bgColor, color }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PaymentModeCard({ icon, mode, amount, color }) {
  return (
    <div className="card card-sm" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color }}>
        {icon}
        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{mode}</span>
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '6px' }}>₹{new Intl.NumberFormat('en-IN').format(amount || 0)}</div>
    </div>
  );
}
