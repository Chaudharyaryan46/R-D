import { useRef } from 'react';
import { X, Printer, Share2, CheckCircle2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function InvoiceModal({ data, onClose }) {
  const { transaction, business } = data;
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice-${transaction.invoice_number}`,
  });

  const handleWhatsApp = () => {
    const msg = `*WebBill Invoice*\n` +
      `Invoice: ${transaction.invoice_number}\n` +
      `Date: ${new Date(transaction.created_at).toLocaleDateString('en-IN')}\n` +
      `${transaction.customer_name ? `Customer: ${transaction.customer_name}\n` : ''}` +
      `Items:\n${transaction.items.map(i => `- ${i.name} x${i.quantity} = ₹${i.total_price.toFixed(2)}`).join('\n')}\n` +
      `*Total: ₹${transaction.final_amount.toFixed(2)}*\n` +
      `Payment: ${transaction.payment_mode.toUpperCase()}\n` +
      `Thank you for shopping! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="modal" style={{ maxWidth: '440px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(34,197,94,0.2)', borderRadius: '10px' }}>
              <CheckCircle2 size={24} color="#22c55e" />
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>Bill Generated</h3>
          </div>
          <button className="btn-icon btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Invoice Preview */}
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '70vh' }}>
          <div ref={printRef} style={{
            background: 'white',
            color: '#1a1a1a',
            padding: '40px 30px',
            borderRadius: '2px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.5,
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '4px', textTransform: 'uppercase', color: '#000' }}>
                {business?.name || 'WebBill Store'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '8px' }}>
                PREMIUM GROCERY POS & CRM
              </div>
              {business?.gst_number && (
                <div style={{ fontSize: '12px', background: '#f8f8f8', padding: '4px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
                  GSTIN: {business.gst_number}
                </div>
              )}
            </div>

            <div style={{ borderTop: '2px solid #000', borderBottom: '1px solid #eee', padding: '12px 0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px' }}>
                <div style={{ color: '#888', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Invoice No</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>#{transaction.invoice_number}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px' }}>
                <div style={{ color: '#888', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Date & Time</div>
                <div style={{ fontWeight: 600 }}>{new Date(transaction.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            </div>

            {transaction.customer_name && (
              <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #000' }}>
                <div style={{ color: '#888', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Customer Details</div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{transaction.customer_name}</div>
                {transaction.status !== 'paid' && (
                  <div style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: '#fffbeb', color: '#92400e', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #fef3c7' }}>
                    PENDING UDHAAR: ₹{(transaction.final_amount - (transaction.amount_paid || 0)).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: 800 }}>Item Description</th>
                  <th style={{ textAlign: 'center', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: 800 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: 800 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f2f2f2' }}>
                    <td style={{ padding: '12px 0' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#000' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>Rate: ₹{item.unit_price} per {item.unit}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 0', fontWeight: 600, fontSize: '13px' }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 700, fontSize: '13px', color: '#000' }}>
                      ₹{item.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Billing Summary */}
            <div style={{ marginLeft: 'auto', width: '100%', borderTop: '2px solid #000', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: '#666' }}>Subtotal</span>
                <span style={{ fontWeight: 700 }}>₹{transaction.subtotal.toFixed(2)}</span>
              </div>
              
              {transaction.tax_total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>Tax (GST)</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>+₹{transaction.tax_total.toFixed(2)}</span>
                </div>
              )}

              {transaction.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>Discount Applied</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>-₹{transaction.discount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 0', 
                marginTop: '12px', 
                borderTop: '2px double #000', 
                borderBottom: '2px double #000' 
              }}>
                <span style={{ fontSize: '18px', fontWeight: 900 }}>GRAND TOTAL</span>
                <span style={{ fontSize: '18px', fontWeight: 900 }}>₹{transaction.final_amount.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px' }}>
                <div style={{ color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Payment Details</div>
                <div style={{ fontWeight: 800, color: '#2563eb' }}>{transaction.payment_mode.toUpperCase()} RECEIVED</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #ccc' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Thank you for your visit! 🙏</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Invoice powered by WebBill ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-footer" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn btn-ghost" id="whatsapp-share" onClick={handleWhatsApp} style={{ flex: 1 }}>
              <Share2 size={16} /> WhatsApp
            </button>
            <button className="btn btn-primary" id="print-invoice" onClick={handlePrint} style={{ flex: 1 }}>
              <Printer size={16} /> Print Bill
            </button>
            <button className="btn btn-success" onClick={onClose} style={{ flex: 1 }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
