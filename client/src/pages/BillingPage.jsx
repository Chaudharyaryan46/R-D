import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Trash2, Plus, Minus, UserPlus, Printer, X, Barcode, ChevronDown } from 'lucide-react';
import API from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/InvoiceModal';

export default function BillingPage() {
  const { business } = useAuth();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [splitPayments, setSplitPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const searchRef = useRef(null);

  // Keyboard shortcut: F2 = focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fetch items for search
  useEffect(() => {
    if (search.length < 1) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/items?search=${search}`);
        setSearchResults(res.data.slice(0, 8));
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Customer search
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/customers?search=${customerSearch}`);
        setCustomerResults(res.data.slice(0, 5));
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const addToCart = useCallback((item) => {
    if (item.stock <= 0) {
      toast.error(`${item.name} is out of stock!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) {
        return prev.map((c) =>
          c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setSearch('');
    setSearchResults([]);
  }, []);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c._id === id ? { ...c, quantity: Math.max(0, +(c.quantity + delta).toFixed(3)) } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const setQty = (id, val) => {
    const qty = parseFloat(val) || 0;
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c._id !== id));
    } else {
      setCart((prev) => prev.map((c) => (c._id === id ? { ...c, quantity: qty } : c)));
    }
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c._id !== id));

  // Calculations
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const discountVal = discountType === 'percent'
    ? (subtotal * (parseFloat(discount) || 0)) / 100
    : parseFloat(discount) || 0;
  const taxTotal = cart.reduce((s, c) => s + ((c.tax_rate || 0) / 100) * c.price * c.quantity, 0);
  const finalAmount = Math.max(0, subtotal - discountVal + taxTotal);
  const change = (parseFloat(amountPaid) || 0) - finalAmount;

  const handlePay = async () => {
    if (cart.length === 0) return toast.error('Cart is empty!');
    setLoading(true);
    try {
      const transactionItems = cart.map((c) => ({
        item_id: c._id,
        name: c.name,
        quantity: c.quantity,
        unit: c.unit,
        unit_price: c.price,
        tax_rate: c.tax_rate || 0,
        total_price: c.price * c.quantity,
      }));

      const actualPaid = amountPaid === '' ? finalAmount : parseFloat(amountPaid);

      if (actualPaid < finalAmount && !customer && !customerPhone) {
        setLoading(false);
        return toast.error('Phone number is required to create a new Udhaar profile!');
      }

      const payload = {
        customer_id: customer?._id || null,
        customer_name: customer?.name || customerSearch || '',
        customer_phone: customerPhone,
        items: transactionItems,
        subtotal,
        discount: discountVal,
        discount_type: discountType,
        tax_total: taxTotal,
        final_amount: finalAmount,
        amount_paid: actualPaid,
        payment_mode: paymentMode,
        split_payments: paymentMode === 'split' ? splitPayments : [],
        status: actualPaid >= finalAmount ? 'paid' : (actualPaid > 0 ? 'partial' : 'unpaid'),
      };

      const res = await API.post('/transactions', payload);
      toast.success('Bill created successfully! 🎉');
      setInvoiceData({ transaction: res.data, business });
      setCart([]);
      setDiscount('');
      setCustomer(null);
      setAmountPaid('');
      setCustomerPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (cart.length === 0) return;
    if (confirm('Clear cart?')) {
      setCart([]);
      setDiscount('');
      setCustomer(null);
      setAmountPaid('');
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px' }}>
      {/* Left: Item Search + Cart */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '12px' }}>
        {/* Search Bar */}
        <div className="card card-sm">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, position: 'relative' }}>
              <Search className="search-icon" size={16} />
              <input
                id="pos-search"
                ref={searchRef}
                className="input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search item or scan barcode... (F2)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button id="pos-clear" className="btn btn-ghost btn-sm" onClick={handleClear}>
              <X size={14} /> Clear
            </button>
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}>
              {searchResults.map((item) => (
                <div
                  key={item._id}
                  onClick={() => addToCart(item)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.category} · {item.unit} · Stock: {item.stock}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{item.price}</div>
                    {item.stock <= item.min_stock && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Low</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>🛒 Cart</h3>
            <span className="badge badge-primary">{cart.length} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="loading-center" style={{ flex: 1, gap: '8px' }}>
              <span style={{ fontSize: '2.5rem' }}>🛒</span>
              <p className="text-muted text-sm">Cart is empty. Search or scan items above.</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 40px', gap: '8px', padding: '6px 8px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <span>ITEM</span>
                <span style={{ textAlign: 'center' }}>QTY</span>
                <span style={{ textAlign: 'right' }}>TOTAL</span>
                <span></span>
              </div>

              {cart.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 80px 40px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{item.price}/{item.unit}</div>
                  </div>

                  {/* Qty control */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button className="qty-btn" onClick={() => updateQty(item._id, -(['kg', 'litre', 'gm', 'ml'].includes(item.unit) ? 0.1 : 1))}>
                      <Minus size={10} />
                    </button>
                    <input
                      type="number"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => setQty(item._id, e.target.value)}
                      style={{ width: '42px', padding: '4px 6px', textAlign: 'center', fontSize: '0.8rem' }}
                    />
                    <button className="qty-btn" onClick={() => updateQty(item._id, ['kg', 'litre', 'gm', 'ml'].includes(item.unit) ? 0.1 : 1)}>
                      <Plus size={10} />
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button className="btn-icon btn btn-ghost" onClick={() => removeFromCart(item._id)}>
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Bill Summary */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>📄 Bill Summary</h3>

        {/* Customer Selection */}
        <div className="input-group mb-4">
          <label className="input-label">Customer (Optional)</label>
          {customer ? (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)',
              border: '1px solid var(--success)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{customer.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{customer.phone}</div>
                {customer.balance < 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>
                    Udhaar: ₹{Math.abs(customer.balance)}
                  </div>
                )}
              </div>
              <button className="btn-icon btn btn-ghost" onClick={() => setCustomer(null)}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                id="customer-search"
                className="input"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customerResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '40px', left: 0, right: 0,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', zIndex: 10, overflow: 'hidden',
                }}>
                  {customerResults.map((c) => (
                    <div key={c._id} onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
            </div>

            {taxTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Tax (GST)</span>
                <span style={{ fontWeight: 600, color: 'var(--warning)' }}>+₹{taxTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Discount */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-muted">Discount</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>-₹{discountVal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select className="input" style={{ flex: '0 0 80px', padding: '6px 8px', fontSize: '0.8rem' }}
                  value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Off</option>
                </select>
                <input
                  id="discount-input"
                  className="input"
                  type="number"
                  placeholder={discountType === 'percent' ? '% discount' : '₹ discount'}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div className="divider" style={{ margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>Total</span>
              <span className="gradient-text">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="input-group mt-4 mb-4">
            <label className="input-label">Payment Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['cash', 'upi', 'card', 'split'].map((mode) => (
                <button
                  key={mode}
                  className={`btn btn-sm ${paymentMode === mode ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPaymentMode(mode)}
                  style={{ fontSize: '0.75rem' }}
                >
                  {mode === 'cash' ? '💵' : mode === 'upi' ? '📱' : mode === 'card' ? '💳' : '✂️'}
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Cash received / Change */}
          {paymentMode !== 'split' && (
            <div className="input-group mb-4">
              <label className="input-label">Amount Received (₹)</label>
              <input
                id="amount-paid"
                className="input"
                type="number"
                placeholder={`Min ₹${finalAmount.toFixed(0)}`}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              {change > 0 && (
                <div className="alert alert-success" style={{ marginTop: '6px', padding: '6px 10px', fontSize: '0.8rem' }}>
                  💰 Change: ₹{change.toFixed(2)}
                </div>
              )}
              {amountPaid !== '' && parseFloat(amountPaid) < finalAmount && (
                <>
                  <div className="alert alert-warning" style={{ marginTop: '6px', padding: '6px 10px', fontSize: '0.8rem' }}>
                    ⚠️ Udhaar: ₹{(finalAmount - parseFloat(amountPaid)).toFixed(2)}
                  </div>
                  {!customer && (
                    <div className="input-group mt-3" style={{ border: '1px solid var(--warning)', padding: '10px', borderRadius: 'var(--radius)', background: 'rgba(245,158,11,0.05)' }}>
                      <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700 }}>📱 NEW CUSTOMER PHONE (FOR UDHAAR)</label>
                      <input
                        className="input"
                        placeholder="Enter phone number..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                      <p style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.8 }}>Required to automatically create CRM profile</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Split Payment inputs */}
          {paymentMode === 'split' && (
            <div className="mb-4">
              <label className="input-label mb-2">Split Payment</label>
              {['cash', 'upi', 'card'].map((mode) => (
                <div key={mode} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ width: '40px', fontSize: '0.75rem', fontWeight: 600 }}>{mode.toUpperCase()}</span>
                  <input
                    className="input"
                    type="number"
                    placeholder="₹0"
                    value={splitPayments.find(s => s.mode === mode)?.amount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSplitPayments(prev => {
                        const filtered = prev.filter(s => s.mode !== mode);
                        if (val > 0) return [...filtered, { mode, amount: val }];
                        return filtered;
                      });
                    }}
                    style={{ flex: 1, fontSize: '0.875rem' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pay Button */}
        <button
          id="pos-pay"
          className="btn btn-success btn-lg"
          style={{ width: '100%', marginTop: '12px', fontSize: '1rem' }}
          onClick={handlePay}
          disabled={loading || cart.length === 0}
        >
          {loading ? (
            <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Processing...</>
          ) : (
            <>⚡ Pay ₹{finalAmount.toFixed(2)}</>
          )}
        </button>
      </div>

      {/* Invoice Modal */}
      {invoiceData && (
        <InvoiceModal
          data={invoiceData}
          onClose={() => setInvoiceData(null)}
        />
      )}
    </div>
  );
}
