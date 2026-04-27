import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "billing.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      pan_no TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      description TEXT,
      rate REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_code TEXT UNIQUE,
      customer_id TEXT NOT NULL,
      reference_no TEXT,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      currency TEXT DEFAULT 'NPR',
      exchange_rate REAL DEFAULT 1,
      warehouse_id TEXT,
      is_export INTEGER DEFAULT 0,
      subtotal REAL DEFAULT 0,
      discount_total REAL DEFAULT 0,
      tax_total REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      received_by TEXT,
      expiry TEXT,
      batch_no TEXT,
      udf TEXT,
      tds_applicable INTEGER DEFAULT 0,
      tds_amount REAL DEFAULT 0,
      terms TEXT,
      reporting_tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT,
      description TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      rate REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'percent',
      tax_rate REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      reference TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      UNIQUE(product_id, warehouse_id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reference TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      pan_no TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      bill_code TEXT UNIQUE,
      supplier_id TEXT NOT NULL,
      reference_no TEXT,
      bill_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      currency TEXT DEFAULT 'NPR',
      exchange_rate REAL DEFAULT 1,
      warehouse_id TEXT,
      subtotal REAL DEFAULT 0,
      discount_total REAL DEFAULT 0,
      tax_total REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      product_id TEXT,
      description TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      rate REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS units_of_measurement (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      abbreviation TEXT NOT NULL,
      type TEXT DEFAULT 'unit',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS warehouse_transfers (
      id TEXT PRIMARY KEY,
      transfer_code TEXT UNIQUE,
      from_warehouse_id TEXT NOT NULL,
      to_warehouse_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      transfer_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS production_orders (
      id TEXT PRIMARY KEY,
      order_code TEXT UNIQUE,
      product_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      start_date TEXT,
      end_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id TEXT PRIMARY KEY,
      adjustment_code TEXT UNIQUE,
      warehouse_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      adjustment_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reason TEXT,
      notes TEXT,
      adjustment_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT,
      email TEXT,
      group_id TEXT,
      is_admin INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES user_groups(id)
    );

    CREATE TABLE IF NOT EXISTS user_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS group_permissions (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      module TEXT NOT NULL,
      can_view INTEGER DEFAULT 1,
      can_create INTEGER DEFAULT 0,
      can_edit INTEGER DEFAULT 0,
      can_delete INTEGER DEFAULT 0,
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      UNIQUE(group_id, module)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      module TEXT,
      record_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default admin user and groups if needed
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c === 0) {
    const { v4: uuid } = require("uuid");

    // Create groups
    const adminGroupId = uuid();
    const salesGroupId = uuid();
    const inventoryGroupId = uuid();
    const viewerGroupId = uuid();

    db.prepare("INSERT INTO user_groups (id, name, description) VALUES (?, ?, ?)").run(adminGroupId, "Administrator", "Full access to all modules");
    db.prepare("INSERT INTO user_groups (id, name, description) VALUES (?, ?, ?)").run(salesGroupId, "Sales Team", "Access to sales, invoices, and customers");
    db.prepare("INSERT INTO user_groups (id, name, description) VALUES (?, ?, ?)").run(inventoryGroupId, "Inventory Manager", "Access to inventory and products");
    db.prepare("INSERT INTO user_groups (id, name, description) VALUES (?, ?, ?)").run(viewerGroupId, "Viewer", "Read-only access to all modules");

    // Admin group — full access to all modules
    const modules = ["dashboard", "invoices", "customers", "payments", "products", "inventory", "bills", "suppliers", "users", "audit_log"];
    for (const mod of modules) {
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, 1, 1, 1, 1)").run(uuid(), adminGroupId, mod);
    }

    // Sales group
    for (const mod of ["dashboard", "invoices", "customers", "payments"]) {
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, 1, 1, 1, ?)").run(uuid(), salesGroupId, mod, mod === "dashboard" ? 0 : 1);
    }
    for (const mod of ["products", "inventory"]) {
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, 1, 0, 0, 0)").run(uuid(), salesGroupId, mod);
    }

    // Inventory group
    for (const mod of ["dashboard", "products", "inventory"]) {
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, 1, 1, 1, 1)").run(uuid(), inventoryGroupId, mod);
    }
    for (const mod of ["invoices", "customers"]) {
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, 1, 0, 0, 0)").run(uuid(), inventoryGroupId, mod);
    }

    // Viewer group — view only
    for (const mod of modules) {
      if (mod === "users" || mod === "audit_log") continue;
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, 1, 0, 0, 0)").run(uuid(), viewerGroupId, mod);
    }

    // Default admin user (password: admin123)
    db.prepare("INSERT INTO users (id, username, password, full_name, email, group_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, 1)").run(uuid(), "admin", "admin123", "System Admin", "admin@company.com", adminGroupId);
    db.prepare("INSERT INTO users (id, username, password, full_name, email, group_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, 0)").run(uuid(), "anish", "anish123", "Anish Balami", "anish@company.com", salesGroupId);
  }

  // Add new product columns if they don't exist
  const cols = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  const newCols: [string, string][] = [
    ["category", "TEXT"],
    ["brand", "TEXT"],
    ["sku", "TEXT"],
    ["weight", "REAL"],
    ["dimensions", "TEXT"],
    ["min_stock_level", "REAL DEFAULT 0"],
    ["image_path", "TEXT"],
    ["product_type", "TEXT DEFAULT 'goods'"],
    ["hs_code", "TEXT"],
    ["available_for_sale", "INTEGER DEFAULT 1"],
    ["selling_price", "REAL DEFAULT 0"],
    ["purchase_price", "REAL DEFAULT 0"],
    ["sales_account", "TEXT"],
    ["purchase_account", "TEXT"],
    ["sales_return_account", "TEXT"],
    ["purchase_return_account", "TEXT"],
    ["valuation_method", "TEXT"],
    ["track_inventory", "INTEGER DEFAULT 1"],
  ];
  for (const [col, type] of newCols) {
    if (!colNames.has(col)) {
      db.exec(`ALTER TABLE products ADD COLUMN ${col} ${type}`);
    }
  }

  // Seed data if empty
  const count = db.prepare("SELECT COUNT(*) as c FROM customers").get() as { c: number };
  if (count.c === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const { v4: uuid } = require("uuid");

  // Warehouses
  const wh1 = uuid(), wh2 = uuid();
  db.prepare("INSERT INTO warehouses (id, name, location) VALUES (?, ?, ?)").run(wh1, "Main Warehouse", "Kathmandu");
  db.prepare("INSERT INTO warehouses (id, name, location) VALUES (?, ?, ?)").run(wh2, "Branch Warehouse", "Pokhara");

  // Customers
  const customers = [
    { name: "Himalayan Traders Pvt. Ltd.", email: "info@himalayantraders.com", phone: "01-4567890", address: "Thamel, Kathmandu", pan: "123456789" },
    { name: "Everest Supplies Co.", email: "contact@everestsupplies.com", phone: "01-4321098", address: "New Road, Kathmandu", pan: "987654321" },
    { name: "Pokhara Electronics", email: "sales@pokharaelec.com", phone: "061-523456", address: "Lakeside, Pokhara", pan: "456789123" },
    { name: "Lumbini Hardware Store", email: "lumbini.hw@gmail.com", phone: "071-412345", address: "Butwal, Lumbini", pan: "789123456" },
    { name: "Chitwan Auto Parts", email: "chitwan.auto@email.com", phone: "056-534567", address: "Bharatpur, Chitwan", pan: "321654987" },
  ];
  for (const c of customers) {
    db.prepare("INSERT INTO customers (id, name, email, phone, address, pan_no) VALUES (?, ?, ?, ?, ?, ?)").run(uuid(), c.name, c.email, c.phone, c.address, c.pan);
  }

  // Suppliers
  const suppliers = [
    { name: "Nepal Cement Industries", email: "sales@nepalcement.com", phone: "01-4112233", address: "Hetauda Industrial Area", pan: "501234567" },
    { name: "Himal Iron & Steel Pvt. Ltd.", email: "info@himaliron.com", phone: "01-4998877", address: "Balaju, Kathmandu", pan: "502345678" },
    { name: "Sagarmatha Paint House", email: "order@sagpaint.com", phone: "01-4556677", address: "Kalimati, Kathmandu", pan: "503456789" },
  ];
  for (const s of suppliers) {
    db.prepare("INSERT INTO suppliers (id, name, email, phone, address, pan_no) VALUES (?, ?, ?, ?, ?, ?)").run(uuid(), s.name, s.email, s.phone, s.address, s.pan);
  }

  // Products
  const products = [
    { name: "Cement (OPC 53 Grade)", code: "CEM-001", rate: 850, tax: 13, unit: "bag" },
    { name: "TMT Steel Bar 12mm", code: "STL-001", rate: 95, tax: 13, unit: "kg" },
    { name: "River Sand", code: "SND-001", rate: 2500, tax: 13, unit: "cubic meter" },
    { name: "Bricks (1st Class)", code: "BRK-001", rate: 14, tax: 13, unit: "pcs" },
    { name: "Paint - Asian Emulsion 20L", code: "PNT-001", rate: 5200, tax: 13, unit: "bucket" },
    { name: "Electrical Wire 2.5mm", code: "ELC-001", rate: 3800, tax: 13, unit: "roll" },
    { name: "PVC Pipe 4 inch", code: "PVC-001", rate: 650, tax: 13, unit: "pcs" },
    { name: "GI Sheet 0.47mm", code: "GIS-001", rate: 980, tax: 13, unit: "sheet" },
    { name: "Plywood 18mm", code: "PLY-001", rate: 2800, tax: 13, unit: "sheet" },
    { name: "Transportation Service", code: "SRV-001", rate: 5000, tax: 0, unit: "trip" },
  ];
  for (const p of products) {
    db.prepare("INSERT INTO products (id, name, code, rate, tax_rate, unit) VALUES (?, ?, ?, ?, ?, ?)").run(uuid(), p.name, p.code, p.rate, p.tax, p.unit);
  }

  // Product Categories
  const cats = ["Construction", "Electrical", "Plumbing", "Finishing", "Roofing", "Hardware", "Service"];
  for (const c of cats) {
    db.prepare("INSERT INTO product_categories (id, name) VALUES (?, ?)").run(uuid(), c);
  }

  // Units of Measurement
  const uoms = [
    { name: "Pieces", abbr: "pcs", type: "unit" }, { name: "Kilogram", abbr: "kg", type: "weight" },
    { name: "Bag", abbr: "bag", type: "unit" }, { name: "Roll", abbr: "roll", type: "unit" },
    { name: "Sheet", abbr: "sheet", type: "unit" }, { name: "Bucket", abbr: "bucket", type: "volume" },
    { name: "Cubic Meter", abbr: "m³", type: "volume" }, { name: "Trip", abbr: "trip", type: "service" },
    { name: "Meter", abbr: "m", type: "length" }, { name: "Liter", abbr: "L", type: "volume" },
    { name: "Gram", abbr: "g", type: "weight" }, { name: "Box", abbr: "box", type: "unit" },
  ];
  for (const u of uoms) {
    db.prepare("INSERT INTO units_of_measurement (id, name, abbreviation, type) VALUES (?, ?, ?, ?)").run(uuid(), u.name, u.abbr, u.type);
  }

  // Sample invoices
  const custRows = db.prepare("SELECT id FROM customers").all() as { id: string }[];
  const inv1 = uuid(), inv2 = uuid(), inv3 = uuid();
  const prodRows = db.prepare("SELECT id, rate, tax_rate FROM products LIMIT 3").all() as { id: string; rate: number; tax_rate: number }[];

  db.prepare(`INSERT INTO invoices (id, invoice_code, customer_id, invoice_date, due_date, warehouse_id, subtotal, tax_total, grand_total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(inv1, "INV-0001", custRows[0].id, "2026-04-20", "2026-05-20", wh1, 10000, 1300, 11300, "sent");

  db.prepare(`INSERT INTO invoices (id, invoice_code, customer_id, invoice_date, due_date, warehouse_id, subtotal, tax_total, grand_total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(inv2, "INV-0002", custRows[1].id, "2026-04-15", "2026-04-25", wh1, 25000, 3250, 28250, "overdue");

  db.prepare(`INSERT INTO invoices (id, invoice_code, customer_id, invoice_date, due_date, warehouse_id, subtotal, tax_total, grand_total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(inv3, "INV-0003", custRows[2].id, "2026-04-22", "2026-05-22", wh2, 15600, 2028, 17628, "paid");

  // Invoice items
  db.prepare("INSERT INTO invoice_items (id, invoice_id, product_id, quantity, rate, tax_rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), inv1, prodRows[0].id, 10, prodRows[0].rate, prodRows[0].tax_rate, 10000);
  db.prepare("INSERT INTO invoice_items (id, invoice_id, product_id, quantity, rate, tax_rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), inv2, prodRows[1].id, 200, prodRows[1].rate, prodRows[1].tax_rate, 19000);
  db.prepare("INSERT INTO invoice_items (id, invoice_id, product_id, quantity, rate, tax_rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), inv2, prodRows[2].id, 2, prodRows[2].rate, prodRows[2].tax_rate, 5000);
  db.prepare("INSERT INTO invoice_items (id, invoice_id, product_id, quantity, rate, tax_rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), inv3, prodRows[0].id, 15, prodRows[0].rate, prodRows[0].tax_rate, 12750);

  // Payment for paid invoice
  db.prepare("INSERT INTO payments (id, invoice_id, amount, payment_date, payment_method, reference) VALUES (?, ?, ?, ?, ?, ?)").run(uuid(), inv3, 17628, "2026-04-23", "bank_transfer", "CHQ-12345");

  // Seed inventory
  const allProds = db.prepare("SELECT id, name FROM products").all() as { id: string; name: string }[];
  const stockLevels = [500, 2000, 50, 10000, 30, 100, 200, 150, 80, 0]; // last one is service, no stock
  for (let i = 0; i < allProds.length; i++) {
    if (stockLevels[i] === 0) continue; // skip services
    const q1 = Math.floor(stockLevels[i] * 0.7);
    const q2 = stockLevels[i] - q1;
    db.prepare("INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)").run(uuid(), allProds[i].id, wh1, q1);
    db.prepare("INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)").run(uuid(), allProds[i].id, wh2, q2);
    // Initial stock-in movements
    db.prepare("INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), allProds[i].id, wh1, "in", q1, "INIT", "Initial stock");
    db.prepare("INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), allProds[i].id, wh2, "in", q2, "INIT", "Initial stock");
  }

  // Update product details with categories, brands, min stock levels
  const updates = [
    { code: "CEM-001", category: "Construction", brand: "Maruti Cement", sku: "SKU-CEM-001", min_stock: 100 },
    { code: "STL-001", category: "Construction", brand: "Himal Iron", sku: "SKU-STL-001", min_stock: 500 },
    { code: "SND-001", category: "Construction", brand: null, sku: "SKU-SND-001", min_stock: 10 },
    { code: "BRK-001", category: "Construction", brand: null, sku: "SKU-BRK-001", min_stock: 2000 },
    { code: "PNT-001", category: "Finishing", brand: "Asian Paints", sku: "SKU-PNT-001", min_stock: 10 },
    { code: "ELC-001", category: "Electrical", brand: "Polycab", sku: "SKU-ELC-001", min_stock: 20 },
    { code: "PVC-001", category: "Plumbing", brand: "Prince", sku: "SKU-PVC-001", min_stock: 50 },
    { code: "GIS-001", category: "Roofing", brand: "Himal GI", sku: "SKU-GIS-001", min_stock: 30 },
    { code: "PLY-001", category: "Finishing", brand: "Greenply", sku: "SKU-PLY-001", min_stock: 20 },
    { code: "SRV-001", category: "Service", brand: null, sku: "SKU-SRV-001", min_stock: 0 },
  ];
  for (const u of updates) {
    db.prepare("UPDATE products SET category=?, brand=?, sku=?, min_stock_level=? WHERE code=?").run(u.category, u.brand, u.sku, u.min_stock, u.code);
  }
}
