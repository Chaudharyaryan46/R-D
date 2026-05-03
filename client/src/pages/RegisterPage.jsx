import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    businessName: '', name: '', email: '', password: '',
    phone: '', address: '', gst_enabled: false, gst_number: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      login(res.data);
      toast.success('Business registered! Welcome to WebMart ⚡');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%), var(--bg-base)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: '24px',
          }}>⚡</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="gradient-text">Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>Set up your store on WebMart</p>
        </div>

        <div className="card" style={{ borderRadius: 'var(--radius-xl)', padding: '28px' }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="input-group">
              <label className="input-label">Store / Business Name</label>
              <input id="reg-business" className="input" placeholder="e.g. Sharma Kirana Store" value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Your Name</label>
                <input id="reg-name" className="input" placeholder="Ram Sharma" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input id="reg-phone" className="input" placeholder="9876543210" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input id="reg-email" className="input" type="email" placeholder="you@store.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input id="reg-password" className="input" type="password" placeholder="Min 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>

            <div className="input-group">
              <label className="input-label">Address (Optional)</label>
              <input id="reg-address" className="input" placeholder="Shop address" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <input id="reg-gst" type="checkbox" checked={form.gst_enabled}
                onChange={(e) => setForm({ ...form, gst_enabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
              <label htmlFor="reg-gst" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enable GST Billing</label>
            </div>

            {form.gst_enabled && (
              <div className="input-group">
                <label className="input-label">GST Number</label>
                <input id="reg-gst-num" className="input" placeholder="22ABCDE1234F1Z5" value={form.gst_number}
                  onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
              </div>
            )}

            <button id="reg-submit" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Creating...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
