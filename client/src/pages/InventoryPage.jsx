import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Package } from 'lucide-react';
import API from '../api/client';
import toast from 'react-hot-toast';

const CATEGORIES = ['General', 'Grains', 'Pulses', 'Dairy', 'Snacks', 'Beverages', 'Spices', 'Oil & Ghee', 'Personal Care', 'Cleaning'];
const UNITS = ['pcs', 'kg', 'gm', 'litre', 'ml', 'dozen'];

const emptyForm = {
  name: '', barcode: '', category: 'General', unit: 'pcs',
  price: '', cost_price: '', tax_rate: '', stock: '', min_stock: '5', expiry_date: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterLow, setFilterLow] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterLow) params.append('low_stock', 'true');
      const res = await API.get(`/items?${params}`);
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, filterLow]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      barcode: item.barcode || '',
      category: item.category || 'General',
      unit: item.unit || 'pcs',
      price: item.price,
      cost_price: item.cost_price || '',
      tax_rate: item.tax_rate || '',
      stock: item.stock,
      min_stock: item.min_stock || '5',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error('Name and price are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        cost_price: parseFloat(form.cost_price) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
        stock: parseFloat(form.stock) || 0,
        min_stock: parseFloat(form.min_stock) || 5,
      };
      if (!payload.expiry_date) delete payload.expiry_date;

      if (editItem) {
        await API.put(`/items/${editItem._id}`, payload);
        toast.success('Item updated!');
      } else {
        await API.post('/items', payload);
        toast.success('Item added!');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await API.delete(`/items/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const lowStockCount = items.filter(i => i.stock <= i.min_stock).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventory</h2>
          <p className="page-subtitle text-muted">{items.length} items · {lowStockCount > 0 && <span style={{ color: 'var(--warning)' }}>{lowStockCount} low stock</span>}</p>
        </div>
        <button id="add-item-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search className="search-icon" size={16} />
          <input id="inv-search" className="input" style={{ paddingLeft: '36px' }}
            placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button
          className={`btn ${filterLow ? 'btn-warning' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilterLow(!filterLow)}
        >
          <AlertTriangle size={14} /> Low Stock
        </button>
      </div>

      {/* Stats row */}
      {lowStockCount > 0 && (
        <div className="alert alert-warning mb-4">
          <AlertTriangle size={16} />
          <span>{lowStockCount} items are below minimum stock level!</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Barcode</th>
                <th>Price (₹)</th>
                <th>Tax %</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-center" style={{ minHeight: 'auto' }}>
                    <div className="spinner" /><span className="text-muted">Loading...</span>
                  </div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Package size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                  No items found. Add your first item!
                </td></tr>
              ) : items.map((item) => {
                const isLow = item.stock <= item.min_stock;
                const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.expiry_date && (
                        <div style={{ fontSize: '0.7rem', color: isExpired ? 'var(--danger)' : 'var(--text-muted)' }}>
                          Exp: {new Date(item.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-gray">{item.category}</span></td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {item.barcode || '-'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{item.price}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.tax_rate || 0}%</td>
                    <td style={{ fontWeight: 700 }}>{item.stock}</td>
                    <td><span className="badge badge-info">{item.unit}</span></td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">Expired</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button id={`edit-item-${item._id}`} className="btn-icon btn btn-ghost" onClick={() => openEdit(item)}>
                          <Edit2 size={14} color="var(--primary-light)" />
                        </button>
                        <button id={`del-item-${item._id}`} className="btn-icon btn btn-ghost" onClick={() => handleDelete(item._id, item.name)}>
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Item' : '➕ Add Item'}</h3>
              <button className="btn-icon btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">Item Name *</label>
                  <input id="item-name" className="input" placeholder="e.g. Aashirvaad Atta 5kg"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Unit</label>
                    <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Selling Price (₹) *</label>
                    <input id="item-price" className="input" type="number" placeholder="0"
                      value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Cost Price (₹)</label>
                    <input className="input" type="number" placeholder="0"
                      value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Stock Qty</label>
                    <input id="item-stock" className="input" type="number" placeholder="0"
                      value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Min Stock Alert</label>
                    <input className="input" type="number" placeholder="5"
                      value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Tax Rate (GST %)</label>
                    <input className="input" type="number" placeholder="0, 5, 12, 18..."
                      value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Barcode</label>
                    <input id="item-barcode" className="input" placeholder="Barcode/SKU"
                      value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Expiry Date (Optional)</label>
                  <input className="input" type="date"
                    value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-item" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editItem ? 'Update Item' : 'Add Item')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
