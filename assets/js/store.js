/**
 * Bite POS — local-first state.
 * Every entity lives in localStorage so the register keeps working offline.
 * All mutations are explicit and followed by saveState().
 */
import {
  uid, round2, round3, num, toast, isToday, dateKey, lastNDays,
} from './utils.js';

export const STORAGE_KEY = 'bite.pos.v1';
export const SESSION_KEY = 'bite.session.v1';
export const SCHEMA_VERSION = 1;

export const ROLES = ['admin', 'manager', 'cashier', 'waiter', 'chef'];

export const ROLE_META = {
  admin: { label: 'Admin', perms: 'Full access', avatar: '#f2d3bd' },
  manager: { label: 'Manager', perms: 'Floor, billing & staff', avatar: '#dbe2f2' },
  cashier: { label: 'Cashier', perms: 'Orders & payments', avatar: '#d9ebe0' },
  waiter: { label: 'Waiter', perms: 'Tables & kitchen tickets', avatar: '#f2e5c7' },
  chef: { label: 'Chef', perms: 'Kitchen, menu & stock', avatar: '#ecdee8' },
};

const ROLE_PERMS = {
  admin: ['*'],
  manager: [
    'view.pos', 'view.kitchen', 'view.menu', 'view.inventory', 'view.billing', 'view.staff',
    'pos.order', 'bill.settle', 'menu.edit', 'inventory.edit', 'staff.edit',
    'analytics.view', 'backup.manage', 'kitchen.bump', 'sync.manage',
  ],
  cashier: [
    'view.pos', 'view.menu', 'view.inventory', 'view.billing',
    'pos.order', 'bill.settle', 'analytics.view', 'sync.manage',
  ],
  waiter: ['view.pos', 'view.kitchen', 'pos.order', 'sync.manage'],
  chef: [
    'view.kitchen', 'view.menu', 'view.inventory',
    'menu.edit', 'inventory.edit', 'kitchen.bump', 'sync.manage',
  ],
};

export const STATIONS = ['Grill', 'Fryer', 'Cold', 'Oven', 'Bar', 'Pastry'];

export const UNITS = ['piece', 'slice', 'kg', 'g', 'L', 'ml', 'ball', 'strip', 'pack'];

const iso = (date) => new Date(date).toISOString();
const minutesAgo = (mins) => new Date(Date.now() - mins * 60000).toISOString();

function defaultSettings() {
  return {
    restaurant: {
      name: 'Bite Kitchen & Bar',
      tagline: 'Comfort food, sharp service',
      address: '14 Harbor Lane, Portside',
      phone: '+1 (555) 014-8842',
      email: 'hello@bite.restaurant',
      taxId: 'VAT-884-221',
      receiptFooter: 'Thank you for eating with us. See you soon!',
    },
    currency: '$',
    vatPct: 5,
    servicePct: 5,
    invoicePrefix: 'BT',
    nextInvoice: 1001,
    nextOrder: 1001,
    syncEndpoint: 'api/sync.php',
    syncKey: 'bite-dev-key',
    simulateOffline: false,
    lastSyncAt: null,
    lastSyncError: '',
    autoSync: true,
  };
}

function seedUsers() {
  return [
    { id: 'u_admin', name: 'Rina Kapoor', role: 'admin', pin: '1234', shift: 'Morning · 8a–4p', phone: '+1 555 0101', email: 'rina@bite.restaurant', active: true, createdAt: iso(minutesAgo(60 * 24 * 210)), updatedAt: iso(minutesAgo(60 * 24 * 3)) },
    { id: 'u_manager', name: 'Marco Silva', role: 'manager', pin: '2345', shift: 'Mid · 12p–8p', phone: '+1 555 0102', email: 'marco@bite.restaurant', active: true, createdAt: iso(minutesAgo(60 * 24 * 180)), updatedAt: iso(minutesAgo(60 * 24 * 5)) },
    { id: 'u_cashier', name: 'Ayesha Noor', role: 'cashier', pin: '3456', shift: 'Evening · 4p–12a', phone: '+1 555 0103', email: 'ayesha@bite.restaurant', active: true, createdAt: iso(minutesAgo(60 * 24 * 120)), updatedAt: iso(minutesAgo(60 * 24 * 2)) },
    { id: 'u_waiter', name: 'Leo Chen', role: 'waiter', pin: '4567', shift: 'Morning · 8a–4p', phone: '+1 555 0104', email: 'leo@bite.restaurant', active: true, createdAt: iso(minutesAgo(60 * 24 * 95)), updatedAt: iso(minutesAgo(60 * 10)) },
    { id: 'u_chef', name: 'Dev Patel', role: 'chef', pin: '5678', shift: 'Evening · 4p–12a', phone: '+1 555 0105', email: 'dev@bite.restaurant', active: true, createdAt: iso(minutesAgo(60 * 24 * 150)), updatedAt: iso(minutesAgo(60 * 6)) },
    { id: 'u_waiter2', name: 'Sofia Marino', role: 'waiter', pin: '6789', shift: 'Evening · 4p–12a', phone: '+1 555 0106', email: 'sofia@bite.restaurant', active: true, createdAt: iso(minutesAgo(60 * 24 * 70)), updatedAt: iso(minutesAgo(60 * 20)) },
    { id: 'u_chef2', name: 'Nina Ortiz', role: 'chef', pin: '7890', shift: 'Night · 10p–6a', phone: '+1 555 0107', email: 'nina@bite.restaurant', active: false, createdAt: iso(minutesAgo(60 * 24 * 45)), updatedAt: iso(minutesAgo(60 * 24 * 9)) },
  ];
}

function seedCategories() {
  return [
    { id: 'cat_burgers', name: 'Burgers', letter: 'B', tint: '#f7e2d2', sort: 1, updatedAt: iso(minutesAgo(500)) },
    { id: 'cat_sandwiches', name: 'Sandwiches', letter: 'S', tint: '#f1e8d3', sort: 2, updatedAt: iso(minutesAgo(500)) },
    { id: 'cat_sides', name: 'Sides & Snacks', letter: 'F', tint: '#f8efd8', sort: 3, updatedAt: iso(minutesAgo(500)) },
    { id: 'cat_pizza', name: 'Pizza', letter: 'P', tint: '#f2ddd6', sort: 4, updatedAt: iso(minutesAgo(500)) },
    { id: 'cat_drinks', name: 'Drinks', letter: 'D', tint: '#dfe9ea', sort: 5, updatedAt: iso(minutesAgo(500)) },
    { id: 'cat_desserts', name: 'Desserts', letter: 'Sw', tint: '#eee0e9', sort: 6, updatedAt: iso(minutesAgo(500)) },
  ];
}

function seedTables() {
  const make = (id, zone, seats) => ({
    id, name: id, zone, seats, kind: 'dinein', updatedAt: iso(minutesAgo(500)),
  });
  return [
    make('T-01', 'Main hall', 2), make('T-02', 'Main hall', 2), make('T-03', 'Window', 2),
    make('T-04', 'Window', 4), make('T-05', 'Main hall', 4), make('T-06', 'Main hall', 6),
    make('T-07', 'Patio', 4), make('T-08', 'Patio', 4), make('T-09', 'Patio', 6),
    make('T-10', 'Bar', 2),
    { id: 'TAKEAWAY', name: 'Takeaway', zone: 'Counter', seats: 0, kind: 'takeaway', updatedAt: iso(minutesAgo(500)) },
    { id: 'DELIVERY', name: 'Delivery', zone: 'Dispatch', seats: 0, kind: 'delivery', updatedAt: iso(minutesAgo(500)) },
  ];
}
function seedInventory() {
  const rows = [
    ['inv_patty', 'Beef patty', 'piece', 42, 20, 2.40, 'Harbor Meats'],
    ['inv_bun', 'Brioche bun', 'piece', 36, 24, 0.85, 'Sunrise Bakery'],
    ['inv_cheese', 'Cheddar slice', 'slice', 58, 30, 0.45, 'Dairy Co-op'],
    ['inv_lettuce', 'Romaine lettuce', 'kg', 3.2, 2, 4.20, 'GreenLeaf Farms'],
    ['inv_tomato', 'Tomato', 'kg', 4.5, 2, 3.10, 'GreenLeaf Farms'],
    ['inv_onion', 'Red onion', 'kg', 5, 2, 1.80, 'GreenLeaf Farms'],
    ['inv_chicken', 'Chicken thigh', 'piece', 30, 15, 1.90, 'Harbor Meats'],
    ['inv_bacon', 'Bacon', 'strip', 40, 20, 0.60, 'Harbor Meats'],
    ['inv_bread', 'Sandwich bread', 'slice', 60, 30, 0.22, 'Sunrise Bakery'],
    ['inv_roll', 'Sub roll', 'piece', 24, 12, 0.70, 'Sunrise Bakery'],
    ['inv_potato', 'Potato', 'kg', 12.5, 8, 1.40, 'GreenLeaf Farms'],
    ['inv_tortilla', 'Tortilla chips', 'kg', 2.4, 1.5, 6.00, 'Casa Foods'],
    ['inv_cheese_sauce', 'Nacho cheese sauce', 'L', 1.6, 1, 5.50, 'Dairy Co-op'],
    ['inv_jalapeno', 'Jalapeño', 'kg', 0.8, 0.5, 5.00, 'GreenLeaf Farms'],
    ['inv_dough', 'Pizza dough', 'ball', 18, 10, 1.10, 'Sunrise Bakery'],
    ['inv_sauce', 'Pizza sauce', 'L', 3.0, 1.5, 3.80, 'Casa Foods'],
    ['inv_mozzarella', 'Mozzarella', 'kg', 2.6, 1.5, 9.20, 'Dairy Co-op'],
    ['inv_pepperoni', 'Pepperoni', 'kg', 1.2, 0.8, 12.00, 'Harbor Meats'],
    ['inv_beans', 'Coffee beans', 'kg', 1.8, 1, 22.00, 'Roast Lab'],
    ['inv_milk', 'Whole milk', 'L', 8, 4, 1.30, 'Dairy Co-op'],
    ['inv_ice', 'Ice', 'kg', 6, 3, 0.30, 'Portside Ice'],
    ['inv_lemon', 'Lemon', 'kg', 2.2, 1, 2.60, 'GreenLeaf Farms'],
    ['inv_sugar', 'Cane sugar', 'kg', 6, 2, 1.10, 'Casa Foods'],
    ['inv_syrup', 'Vanilla syrup', 'L', 1.1, 0.5, 8.00, 'Roast Lab'],
    ['inv_brownie', 'Chocolate brownie', 'piece', 4, 6, 1.80, 'Bakehouse'],
    ['inv_cream', 'Vanilla ice cream', 'L', 2.4, 1.5, 4.00, 'Dairy Co-op'],
    ['inv_cheesecake', 'Cheesecake slice', 'slice', 3, 6, 2.20, 'Bakehouse'],
    ['inv_mayo', 'House mayo', 'L', 1.4, 0.8, 3.40, 'Casa Foods'],
    ['inv_slaw', 'Slaw mix', 'kg', 0.8, 1.5, 2.90, 'GreenLeaf Farms'],
    ['inv_mushroom', 'Cremini mushroom', 'kg', 0.6, 1, 6.40, 'GreenLeaf Farms'],
    ['inv_basil', 'Fresh basil', 'kg', 0.2, 0.1, 14.00, 'GreenLeaf Farms'],
    ['inv_truffle', 'Truffle oil', 'L', 0, 0.2, 28.00, 'Casa Foods'],
    ['inv_batter', 'Onion ring batter', 'kg', 1.2, 1, 2.10, 'Casa Foods'],
    ['inv_oil', 'Frying oil', 'L', 9, 5, 2.60, 'Casa Foods'],
    ['inv_parmesan', 'Parmesan', 'kg', 0.9, 0.5, 13.00, 'Dairy Co-op'],
  ];
  return rows.map(([id, name, unit, stock, minStock, unitCost, supplier]) => ({
    id, name, unit, stock, minStock, unitCost, supplier, updatedAt: iso(minutesAgo(180)),
  }));
}
function seedMenu() {
  const rows = [
    { id: 'm_smash', categoryId: 'cat_burgers', name: 'Smash Classic', price: 12.5, station: 'Grill', description: 'Double-seared beef, aged cheddar, pickles and house sauce on a toasted brioche bun.', recipe: [['inv_patty', 1], ['inv_bun', 1], ['inv_cheese', 1], ['inv_lettuce', 0.03], ['inv_tomato', 0.03], ['inv_onion', 0.02], ['inv_mayo', 0.02]] },
    { id: 'm_double', categoryId: 'cat_burgers', name: 'Double Stack', price: 16, station: 'Grill', description: 'Two patties, double cheddar, caramelised onion and smoky mayo.', recipe: [['inv_patty', 2], ['inv_bun', 1], ['inv_cheese', 2], ['inv_onion', 0.03], ['inv_mayo', 0.03]] },
    { id: 'm_truffle', categoryId: 'cat_burgers', name: 'Truffle Mushroom', price: 15.5, station: 'Grill', description: 'Beef patty, sautéed cremini, melted cheddar and truffle mayo.', recipe: [['inv_patty', 1], ['inv_bun', 1], ['inv_cheese', 1], ['inv_mushroom', 0.08], ['inv_truffle', 0.008], ['inv_mayo', 0.02]] },
    { id: 'm_crispy', categoryId: 'cat_burgers', name: 'Crispy Chicken', price: 13.5, station: 'Fryer', description: 'Buttermilk fried chicken thigh, slaw, lettuce and honey mayo.', recipe: [['inv_chicken', 1], ['inv_bun', 1], ['inv_slaw', 0.07], ['inv_lettuce', 0.02], ['inv_mayo', 0.02]] },
    { id: 'm_club', categoryId: 'cat_sandwiches', name: 'Club Sandwich', price: 11, station: 'Cold', description: 'Triple-decker chicken, bacon, lettuce and tomato with mayo.', recipe: [['inv_bread', 3], ['inv_chicken', 0.08], ['inv_bacon', 2], ['inv_lettuce', 0.03], ['inv_tomato', 0.03], ['inv_mayo', 0.02]] },
    { id: 'm_blt', categoryId: 'cat_sandwiches', name: 'Classic BLT', price: 9.5, station: 'Cold', description: 'Crisp bacon, romaine, ripe tomato and mayo on sourdough.', recipe: [['inv_bread', 2], ['inv_bacon', 3], ['inv_lettuce', 0.03], ['inv_tomato', 0.04], ['inv_mayo', 0.02]] },
    { id: 'm_italian', categoryId: 'cat_sandwiches', name: 'Italian Sub', price: 12, station: 'Cold', description: 'Salami, ham, cheddar, shredded lettuce and tomato on a soft roll.', recipe: [['inv_roll', 1], ['inv_cheese', 1], ['inv_bacon', 1], ['inv_lettuce', 0.03], ['inv_tomato', 0.03]] },
    { id: 'm_veggie', categoryId: 'cat_sandwiches', name: 'Grilled Veggie Sub', price: 10.5, station: 'Cold', description: 'Roasted mushrooms, tomato, cheddar and basil mayo.', recipe: [['inv_roll', 1], ['inv_mushroom', 0.05], ['inv_tomato', 0.04], ['inv_cheese', 1], ['inv_mayo', 0.02]] },
    { id: 'm_fries', categoryId: 'cat_sides', name: 'Truffle Fries', price: 7, station: 'Fryer', description: 'Skin-on fries tossed with truffle oil, parmesan and herbs.', recipe: [['inv_potato', 0.25], ['inv_truffle', 0.006], ['inv_parmesan', 0.02]] },
    { id: 'm_nachos', categoryId: 'cat_sides', name: 'Loaded Nachos', price: 9, station: 'Fryer', description: 'Tortilla chips, warm cheese sauce, cheddar and jalapeño.', recipe: [['inv_tortilla', 0.12], ['inv_cheese_sauce', 0.06], ['inv_cheese', 1], ['inv_jalapeno', 0.02]] },
    { id: 'm_rings', categoryId: 'cat_sides', name: 'Onion Rings', price: 6.5, station: 'Fryer', description: 'Beer-battered onion rings with smoked paprika salt.', recipe: [['inv_onion', 0.15], ['inv_batter', 0.06], ['inv_oil', 0.04]] },
    { id: 'm_margherita', categoryId: 'cat_pizza', name: 'Margherita', price: 14, station: 'Oven', description: 'San Marzano tomato, fresh mozzarella and basil on a blistered crust.', recipe: [['inv_dough', 1], ['inv_sauce', 0.08], ['inv_mozzarella', 0.12], ['inv_basil', 0.005]] },
    { id: 'm_pepperoni', categoryId: 'cat_pizza', name: 'Pepperoni', price: 16, station: 'Oven', description: 'Classic pepperoni, mozzarella and oregano with a crisp edge.', recipe: [['inv_dough', 1], ['inv_sauce', 0.08], ['inv_mozzarella', 0.12], ['inv_pepperoni', 0.08]] },
    { id: 'm_bbq', categoryId: 'cat_pizza', name: 'Smoky BBQ Chicken', price: 17.5, station: 'Oven', description: 'BBQ base, chicken thigh, mozzarella and sweet red onion.', recipe: [['inv_dough', 1], ['inv_sauce', 0.06], ['inv_mozzarella', 0.12], ['inv_chicken', 0.1], ['inv_onion', 0.03]] },
    { id: 'm_latte', categoryId: 'cat_drinks', name: 'Iced Latte', price: 5, station: 'Bar', description: 'Double espresso, cold milk, vanilla syrup and plenty of ice.', recipe: [['inv_beans', 0.018], ['inv_milk', 0.15], ['inv_ice', 0.12], ['inv_syrup', 0.02]] },
    { id: 'm_lemonade', categoryId: 'cat_drinks', name: 'Fresh Lemonade', price: 4, station: 'Bar', description: 'Hand-pressed lemon, cane sugar and crushed ice.', recipe: [['inv_lemon', 0.12], ['inv_sugar', 0.03], ['inv_ice', 0.15]] },
    { id: 'm_coldbrew', categoryId: 'cat_drinks', name: 'Cold Brew', price: 4.5, station: 'Bar', description: 'Slow-steeped single origin coffee over ice.', recipe: [['inv_beans', 0.022], ['inv_ice', 0.1]] },
    { id: 'm_espresso', categoryId: 'cat_drinks', name: 'Espresso', price: 3.5, station: 'Bar', description: 'Rich double shot with a hazelnut crema.', recipe: [['inv_beans', 0.01]] },
    { id: 'm_brownie', categoryId: 'cat_desserts', name: 'Chocolate Brownie', price: 6.5, station: 'Pastry', description: 'Warm fudge brownie with vanilla ice cream.', recipe: [['inv_brownie', 1], ['inv_cream', 0.06]] },
    { id: 'm_cheesecake', categoryId: 'cat_desserts', name: 'New York Cheesecake', price: 7, station: 'Pastry', description: 'Baked vanilla cheesecake with a buttered biscuit base.', recipe: [['inv_cheesecake', 1]], available: false },
  ];
  return rows.map((row, index) => ({
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    price: row.price,
    station: row.station,
    description: row.description,
    available: row.available !== false,
    recipe: row.recipe.map(([inventoryId, qty]) => ({ inventoryId, qty })),
    sort: index + 1,
    updatedAt: iso(minutesAgo(240)),
  }));
}
function seedOrders() {
  const menu = seedMenu();
  const byId = new Map(menu.map((m) => [m.id, m]));
  const orderNoStart = 1038;
  const makeLine = (menuId, qty, status, sentMins, notes = '') => {
    const item = byId.get(menuId);
    return {
      lineId: uid('line'),
      menuId,
      name: item?.name || menuId,
      price: item?.price || 0,
      qty,
      notes,
      status,
      sentAt: sentMins === null ? null : minutesAgo(sentMins),
      stockDeducted: status !== 'unsent',
      categoryId: item?.categoryId || '',
    };
  };
  return [
    {
      id: 'ord_seed_t3', orderNo: `ORD-${orderNoStart}`, tableId: 'T-03', guests: 2,
      waiterId: 'u_waiter', customerName: '', note: '', discount: 0,
      createdAt: minutesAgo(24), updatedAt: minutesAgo(8), sentAt: minutesAgo(18),
      items: [
        makeLine('m_smash', 1, 'served', 18, 'No pickles'),
        makeLine('m_fries', 1, 'ready', 14),
        makeLine('m_latte', 1, 'cooking', 8),
      ],
    },
    {
      id: 'ord_seed_t7', orderNo: `ORD-${orderNoStart + 1}`, tableId: 'T-07', guests: 4,
      waiterId: 'u_waiter2', customerName: '', note: '', discount: 0,
      createdAt: minutesAgo(13), updatedAt: minutesAgo(7), sentAt: minutesAgo(9),
      items: [
        makeLine('m_margherita', 1, 'cooking', 9),
        makeLine('m_pepperoni', 1, 'cooking', 9),
        makeLine('m_lemonade', 2, 'ready', 7),
      ],
    },
    {
      id: 'ord_seed_take', orderNo: `ORD-${orderNoStart + 2}`, tableId: 'TAKEAWAY', guests: 0,
      waiterId: 'u_cashier', customerName: 'Maya R.', note: 'Pickup at the counter', discount: 0,
      createdAt: minutesAgo(7), updatedAt: minutesAgo(4), sentAt: minutesAgo(5),
      items: [
        makeLine('m_club', 2, 'cooking', 5, 'Cut in halves'),
        makeLine('m_coldbrew', 2, 'ready', 4),
      ],
    },
  ];
}

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedInvoices(menu, tables, settings) {
  const rnd = mulberry32(20261020);
  const sold = menu.filter((item) => item.available !== false);
  const methods = ['cash', 'cash', 'cash', 'card', 'card', 'mobile'];
  const cashiers = [
    ['u_cashier', 'Ayesha Noor'], ['u_manager', 'Marco Silva'], ['u_admin', 'Rina Kapoor'],
  ];
  const dineIn = tables.filter((t) => t.kind === 'dinein');
  const invoices = [];
  let counter = 1001;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
    const count = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < count; i += 1) {
      const at = new Date();
      at.setDate(at.getDate() - dayOffset);
      at.setHours(11 + Math.floor(rnd() * 10), Math.floor(rnd() * 60), 0, 0);
      if (at.getTime() > Date.now() - 12 * 60000) continue;

      const chosen = new Set();
      const items = [];
      const lineCount = 1 + Math.floor(rnd() * 3);
      while (items.length < lineCount) {
        const item = sold[Math.floor(rnd() * sold.length)];
        if (!item || chosen.has(item.id)) continue;
        chosen.add(item.id);
        const qty = rnd() < 0.25 ? 2 : 1;
        items.push({
          lineId: `il_seed_${counter}_${items.length}`,
          menuId: item.id,
          name: item.name,
          price: item.price,
          qty,
          categoryId: item.categoryId,
          lineTotal: round2(item.price * qty),
        });
      }

      const subtotal = round2(items.reduce((sum, line) => sum + line.price * line.qty, 0));
      const discount = rnd() < 0.15 ? round2(subtotal * 0.1) : 0;
      const vatPct = 5;
      const servicePct = 5;
      const taxable = Math.max(0, subtotal - discount);
      const vat = round2(taxable * vatPct / 100);
      const service = round2(taxable * servicePct / 100);
      const total = round2(taxable + vat + service);
      const method = methods[Math.floor(rnd() * methods.length)];
      const cashReceived = method === 'cash' ? Math.ceil(total / 5) * 5 : total;
      const table = rnd() < 0.2 ? { id: 'TAKEAWAY', name: 'Takeaway' } : dineIn[Math.floor(rnd() * dineIn.length)];
      const [cashierId, cashierName] = cashiers[Math.floor(rnd() * cashiers.length)];

      invoices.push({
        id: `inv_seed_${counter}`,
        invoiceNo: `BT-${counter}`,
        at: at.toISOString(),
        createdAt: at.toISOString(),
        tableId: table.id,
        tableName: table.name,
        guests: table.id === 'TAKEAWAY' ? 0 : 1 + Math.floor(rnd() * 4),
        orderId: '',
        orderNo: `ORD-${counter}`,
        items,
        subtotal,
        discount,
        vatPct,
        servicePct,
        vat,
        service,
        total,
        method,
        cashReceived,
        change: round2(cashReceived - total),
        cashierId,
        cashierName,
        waiterName: '',
        note: '',
        synced: true,
      });
      counter += 1;
    }
  }

  return { invoices, nextInvoice: counter };
}
export function createSeedState() {
  const settings = defaultSettings();
  const menu = seedMenu();
  const tables = seedTables();
  const inventory = seedInventory();
  const { invoices, nextInvoice } = seedInvoices(menu, tables, settings);
  settings.nextInvoice = nextInvoice;
  settings.nextOrder = 1041;
  settings.lastSyncAt = null;

  return {
    version: SCHEMA_VERSION,
    createdAt: iso(Date.now()),
    updatedAt: iso(Date.now()),
    settings,
    users: seedUsers(),
    categories: seedCategories(),
    menu,
    inventory,
    inventoryLogs: inventory.map((item) => ({
      id: `log_open_${item.id}`,
      inventoryId: item.id,
      delta: item.stock,
      balance: item.stock,
      reason: 'Opening stock',
      ref: 'SETUP',
      userId: 'u_admin',
      at: iso(Date.now() - 8 * 86400000),
    })),
    tables,
    orders: seedOrders(),
    invoices,
    syncQueue: [],
  };
}

function hydrate(raw) {
  const defaults = defaultSettings();
  const source = raw && typeof raw === 'object' ? raw : {};
  const settings = {
    ...defaults,
    ...(source.settings || {}),
    restaurant: { ...defaults.restaurant, ...(source.settings?.restaurant || {}) },
  };
  const pickArray = (key, fallback) => (Array.isArray(source[key]) ? source[key] : fallback);
  return {
    version: SCHEMA_VERSION,
    createdAt: source.createdAt || iso(Date.now()),
    updatedAt: source.updatedAt || iso(Date.now()),
    settings,
    users: pickArray('users', seedUsers()),
    categories: pickArray('categories', seedCategories()),
    menu: pickArray('menu', seedMenu()),
    inventory: pickArray('inventory', seedInventory()),
    inventoryLogs: pickArray('inventoryLogs', []),
    tables: pickArray('tables', seedTables()),
    orders: pickArray('orders', []).map((order) => ({
      ...order,
      items: Array.isArray(order.items) ? order.items : [],
    })),
    invoices: pickArray('invoices', []).map((invoice) => ({
      ...invoice,
      items: Array.isArray(invoice.items) ? invoice.items : [],
    })),
    syncQueue: pickArray('syncQueue', []),
  };
}

let state = null;
const listeners = new Set();

export function getState() {
  if (!state) loadState();
  return state;
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state = createSeedState();
    persist();
    return state;
  }
  try {
    state = hydrate(JSON.parse(raw));
  } catch (error) {
    console.error('[Bite] Could not read local database', error);
    try { localStorage.setItem(`${STORAGE_KEY}.corrupt.${Date.now()}`, raw.slice(0, 500000)); } catch { /* ignore */ }
    state = createSeedState();
    persist();
    setTimeout(() => toast('Local data was unreadable. Bite started with a clean workspace.', { type: 'warn' }), 300);
  }
  if (!state.settings.syncEndpoint) state.settings.syncEndpoint = 'api/sync.php';
  if (!state.settings.syncKey) state.settings.syncKey = 'bite-dev-key';
  return state;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('[Bite] localStorage write failed', error);
    toast('Could not save locally — storage may be full. Export a backup from the header.', { type: 'error' });
    return false;
  }
}

export function saveState({ silent = false, reason = 'update' } = {}) {
  if (!state) return;
  state.updatedAt = new Date().toISOString();
  persist();
  if (!silent) {
    listeners.forEach((fn) => {
      try { fn(reason, state); } catch (error) { console.error('[Bite] listener error', error); }
    });
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function replaceState(next) {
  state = hydrate(next);
  saveState({ reason: 'import' });
}

export function resetState() {
  state = createSeedState();
  saveState({ reason: 'reset' });
}

export function getSettings() {
  return getState().settings;
}

/* Session */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.userId) return null;
    const age = Date.now() - new Date(parsed.at).getTime();
    if (Number.isFinite(age) && age > 12 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(userId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: new Date().toISOString() }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
/* Permissions */
export function can(user, action) {
  if (!user || user.active === false) return false;
  const perms = ROLE_PERMS[user.role] || [];
  return perms.includes('*') || perms.includes(action);
}

export function roleMeta(role) {
  return ROLE_META[role] || { label: role || 'Staff', perms: '', avatar: '#ece6da' };
}

/* Selectors */
export function findUser(id) {
  return getState().users.find((user) => user.id === id) || null;
}

export function findCategory(id) {
  return getState().categories.find((category) => category.id === id) || null;
}

export function findMenu(id) {
  return getState().menu.find((item) => item.id === id) || null;
}

export function findInventory(id) {
  return getState().inventory.find((item) => item.id === id) || null;
}

export function findTable(id) {
  return getState().tables.find((table) => table.id === id) || null;
}

export function getOpenOrders() {
  return getState().orders;
}

export function getOrderForTable(tableId) {
  return getState().orders.find((order) => order.tableId === tableId) || null;
}

export function orderQty(order) {
  return (order?.items || []).reduce((sum, line) => sum + num(line.qty), 0);
}

export function pendingSyncItems() {
  return getState().syncQueue.filter((item) => item.status !== 'SYNCED');
}

export function pendingSyncCount() {
  return pendingSyncItems().length;
}

export function tableStatus(tableId) {
  const order = getOrderForTable(tableId);
  if (!order || !order.items.length) return 'free';
  const active = order.items.filter((line) => line.status !== 'served');
  if (!active.length) return 'ready';
  if (active.every((line) => line.status === 'ready')) return 'ready';
  return 'occupied';
}

export function stockStatus(item) {
  if (!item) return 'out';
  if (num(item.stock) <= 0) return 'out';
  if (num(item.stock) <= num(item.minStock)) return 'low';
  return 'ok';
}

export function lowStockItems() {
  return getState().inventory.filter((item) => stockStatus(item) !== 'ok');
}

export function inventoryValue() {
  return getState().inventory.reduce((sum, item) => sum + num(item.stock) * num(item.unitCost), 0);
}

export function inventoryUsage(inventoryId) {
  return getState().menu.filter((item) => (item.recipe || []).some((line) => line.inventoryId === inventoryId));
}

/* Totals */
export function computeTotals(items = [], options = {}) {
  const subtotal = round2(items.reduce((sum, line) => sum + num(line.price) * num(line.qty), 0));
  const requestedDiscount = num(options.discount);
  const discount = round2(clampToRange(requestedDiscount, 0, subtotal));
  const vatPct = num(options.vatPct, 5);
  const servicePct = num(options.servicePct, 5);
  const taxable = round2(Math.max(0, subtotal - discount));
  const vat = round2(taxable * vatPct / 100);
  const service = round2(taxable * servicePct / 100);
  const total = round2(taxable + vat + service);
  return {
    subtotal, discount, vatPct, servicePct, vat, service, total,
    qty: round2(items.reduce((sum, line) => sum + num(line.qty), 0)),
  };
}

function clampToRange(value, min, max) {
  return Math.min(max, Math.max(min, num(value)));
}

export function orderTotals(order) {
  const settings = getState().settings;
  return computeTotals(order?.items || [], {
    discount: order?.discount || 0,
    vatPct: settings.vatPct,
    servicePct: settings.servicePct,
  });
}

export function allocateOrderNo() {
  const settings = getState().settings;
  const next = num(settings.nextOrder, 1001);
  settings.nextOrder = next + 1;
  return `ORD-${next}`;
}

export function allocateInvoiceNo() {
  const settings = getState().settings;
  const next = num(settings.nextInvoice, 1001);
  settings.nextInvoice = next + 1;
  return `${settings.invoicePrefix || 'BT'}-${next}`;
}

/* Inventory movements */
export function adjustStock(inventoryId, delta, options = {}) {
  const item = findInventory(inventoryId);
  const change = round3(delta);
  if (!item || !change) return null;
  const at = options.at || new Date().toISOString();
  item.stock = round3(num(item.stock) + change);
  item.updatedAt = at;
  const log = {
    id: uid('log'),
    inventoryId,
    delta: change,
    balance: item.stock,
    reason: options.reason || 'Manual adjustment',
    ref: options.ref || '',
    userId: options.user?.id || options.userId || '',
    at,
  };
  const s = getState();
  s.inventoryLogs.unshift(log);
  if (s.inventoryLogs.length > 2500) s.inventoryLogs.length = 2500;
  return { item, log };
}

export function deductStockForLines(lines = [], options = {}) {
  const results = [];
  const warnings = [];
  const ref = options.ref || '';
  const user = options.user || null;
  const reason = options.reason || 'Recipe deduction';

  lines.forEach((line) => {
    if (!line || line.stockDeducted) return;
    const menuItem = findMenu(line.menuId);
    (menuItem?.recipe || []).forEach((ingredient) => {
      const quantity = num(ingredient.qty) * num(line.qty);
      if (!quantity) return;
      const result = adjustStock(ingredient.inventoryId, -quantity, { reason, ref, user });
      if (result) {
        results.push(result);
        if (stockStatus(result.item) !== 'ok') warnings.push(result.item);
      }
    });
    line.stockDeducted = true;
  });

  return { results, warnings };
}

export function currentUser() {
  const session = getSession();
  if (!session) return null;
  const user = findUser(session.userId);
  if (!user || user.active === false) return null;
  return user;
}
