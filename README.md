# ⚡ WebMart – Smart CRM + POS for Indian Grocery Stores

A complete, production-ready billing and CRM system built specifically for Indian grocery shop owners. Fast like a calculator, packed like Vyapar.

---

## 📁 Folder Structure

```
WebMart/
├── server/                    # Node.js + Express backend
│   ├── models/                # MongoDB Mongoose schemas
│   │   ├── Business.js
│   │   ├── User.js
│   │   ├── Item.js
│   │   ├── Customer.js
│   │   ├── Transaction.js
│   │   ├── Payment.js
│   │   └── Expense.js
│   ├── routes/                # Express API routes
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── items.js
│   │   ├── customers.js
│   │   ├── transactions.js
│   │   ├── payments.js
│   │   └── expenses.js
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── index.js               # Server entry point + Socket.IO
│   ├── seed.js                # Demo data seeder
│   └── .env                   # Server config
│
└── client/                    # React + Vite frontend
    ├── src/
    │   ├── api/
    │   │   └── client.js      # Axios instance with auth
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── Layout.jsx     # Sidebar navigation
    │   │   └── InvoiceModal.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── Dashboard.jsx  # Real-time analytics
    │   │   ├── BillingPage.jsx # Main POS screen
    │   │   ├── InventoryPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   └── ExpensesPage.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css          # Full design system
    └── .env
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

---

### Step 1: MongoDB Setup

**Option A (Local):**
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB: `mongod`

**Option B (MongoDB Atlas - Cloud):**
1. Create free cluster at https://cloud.mongodb.com
2. Get your connection string and update `server/.env`

---

### Step 2: Server Setup

```bash
cd WebMart/server
npm install
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/webmart
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

---

### Step 3: Seed Demo Data

```bash
cd WebMart/server
node seed.js
```

This creates:
- Demo business: **Sharma Kirana Store**
- Admin login: `admin@demo.com` / `demo1234`
- 15 grocery products
- 5 sample customers with udhaar balances

---

### Step 4: Client Setup

```bash
cd WebMart/client
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🌟 Features

### ⚡ Billing / POS
- Search items by name or barcode
- Add quantities (kg, litre, pcs, etc.)
- Apply discount (flat ₹ or percentage)
- Select customer (optional)
- Multiple payment modes: Cash, UPI, Card
- Split payments support
- **Automated Udhaar tracking** (partial payments)
- Printable invoice (80mm/A4)
- WhatsApp share
- **Keyboard Shortcut: Press F2 to focus search**

### 👥 Customer CRM (Automated)
- **Zero-Manual Entry**: Manual 'Add Customer' button removed for faster workflow.
- **Auto-Profile Creation**: New customers are created automatically when they take Udhaar.
- **Smart Filtering**: The CRM only displays customers with active outstanding balances.
- **Auto-Hide**: Customers are automatically removed from the list once their balance reaches ₹0.
- Collect udhaar payments and view full purchase history.

---

## 🛠️ Automated Udhaar Workflow (End-to-End)

WebMart features a state-of-the-art automated credit (Udhaar) tracking system designed for high-speed grocery environments.

### 1. The Trigger
Whenever a bill is generated where the `Amount Received` is less than the `Total Bill`, the system identifies this as an **Udhaar transaction**.

### 2. Intelligent Data Collection
- If a customer is already selected from the CRM, the balance is added to their profile instantly.
- If no customer is selected, a context-aware **Phone Number input** appears automatically in the billing panel.

### 3. Background Automation
When the "Pay" button is clicked:
1.  **Backend Trigger**: The server checks if the transaction has a pending balance.
2.  **Auto-CRM**: If it's a new customer, a CRM profile is created on-the-fly using the typed Name and Phone.
3.  **Balance Sync**: The customer's balance is updated (e.g., `-₹50` if they owe 50).
4.  **Real-time Update**: The Dashboard and CRM list update immediately via WebSockets.

### 4. Self-Cleaning CRM
To keep the shop owner focused on recovery, the CRM dashboard **exclusively displays debtors**. As soon as a customer pays their full amount and their balance reaches ₹0, they are automatically hidden from the list.

---

### 📦 Inventory Management
- Add / Edit / Delete items
- Track stock (auto-decremented on billing)
- Low stock alerts
- Expiry date alerts
- Category and barcode support
- GST tax rate per item

### 📊 Dashboard (Real-Time)
- Today's total sales
- Total orders
- Net profit (sales - expenses)
- Payment method split (Cash/UPI/Card) - *Excludes unpaid udhaar for accurate cash-in-hand tracking*
- Weekly sales chart
- Hourly sales bar chart
- Top 5 selling products
- Low stock alerts
- **Pending udhaar list** (Top 10 debtors)

### 📈 Reports
- Filter by date range (Today / Yesterday / Week / Month / Custom)
- Daily sales breakdown
- Top selling products
- Transaction history
- Profit vs expense summary

### 💸 Expense Tracking
- Add categorized expenses
- Date range filtering
- Net profit calculation

### 🧾 Invoice System
- Auto-generated invoice number
- GST breakdown
- Customer info
- Printable (browser print dialog)
- WhatsApp share (pre-filled message)

---

## ⚡ Real-Time Updates

Uses Socket.IO for live dashboard updates:
- Each billing screen connects to server via WebSocket
- After every transaction, dashboard auto-refreshes
- Business-scoped rooms (multi-tenant ready)

---

## 🔐 Authentication

- JWT tokens stored in localStorage
- 7-day expiry
- Auto-redirect to login on 401
- Role-based: Admin / Staff

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register business + admin |
| POST | /auth/login | Login |
| GET | /dashboard | Analytics data |
| GET | /items | List items |
| POST | /items | Add item |
| PUT | /items/:id | Update item |
| DELETE | /items/:id | Delete item |
| GET | /items/barcode/:barcode | Find by barcode |
| GET | /customers | List customers |
| POST | /customers | Add customer |
| GET | /customers/:id | Customer detail + history |
| POST | /customers/:id/collect | Collect udhaar |
| POST | /transactions | Create bill |
| GET | /transactions | List transactions |
| GET | /transactions/today | Today's bills |
| POST | /expenses | Add expense |
| GET | /expenses | List expenses |

---

## 🎨 UI Design

- **Dark theme** with indigo/blue gradient
- Google Fonts (Inter)
- Glassmorphism cards
- Responsive (mobile + desktop)
- Premium animations and hover effects

---

## 🔧 Production Deployment

### Build Frontend
```bash
cd client
npm run build
# Deploy dist/ folder to Vercel, Netlify, or your server
```

### Deploy Backend
- Deploy to Railway, Render, or any VPS
- Set environment variables
- Use MongoDB Atlas for cloud database

---

## 🛣️ Roadmap (Future)
- [ ] Offline mode (PWA + IndexedDB)
- [ ] Barcode scanner via camera
- [ ] WhatsApp Business API (auto invoice)
- [ ] Multiple businesses / SaaS mode
- [ ] Staff management & permissions
- [ ] Purchase orders & suppliers

---

Made with ❤️ for Indian Grocery Store Owners | **Powered by WebMart ⚡**
