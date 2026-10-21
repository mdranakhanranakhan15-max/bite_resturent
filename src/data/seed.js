export const ALL_MODULES = ['pos', 'kitchen', 'menu', 'inventory', 'bills', 'staff'];

export const SEED_DATA = {
  users: [
    { id: 'u1', name: 'Zayan Khan', username: 'zayan', role: 'Admin', pin: '1234', active: true, permissions: [...ALL_MODULES] },
    { id: 'u2', name: 'Tariq Mahmud', username: 'tariq', role: 'Manager', pin: '1234', active: true, permissions: [...ALL_MODULES] },
    { id: 'u3', name: 'Ayesha Noor', username: 'ayesha', role: 'Cashier', pin: '1234', active: true, permissions: ['pos', 'menu', 'bills'] },
    { id: 'u4', name: 'Samiul Haque', username: 'samiul', role: 'Waiter', pin: '1234', active: true, permissions: ['pos', 'menu'] },
    { id: 'u5', name: 'Chef Arman', username: 'arman', role: 'Chef', pin: '1234', active: true, permissions: ['kitchen', 'menu', 'inventory'] }
  ],
  categories: [
    'Burgers',
    'Sandwiches',
    'Pizza',
    'Sides',
    'Beverages',
    'Desserts'
  ],
  kitchenStations: [
    'Grill',
    'Fryer',
    'Cold',
    'Oven',
    'Bar',
    'Pastry'
  ],
  inventory: [
    { id: 'ing1', name: 'Brioche Burger Bun', qty: 18, unit: 'pcs', minAlert: 20, unitCost: 0.4, supplier: 'Crust Bakery' },
    { id: 'ing2', name: 'Smashed Beef Patty (130g)', qty: 42, unit: 'pcs', minAlert: 15, unitCost: 1.1, supplier: 'Prime Meats' },
    { id: 'ing3', name: 'Crispy Chicken Fillet', qty: 12, unit: 'pcs', minAlert: 15, unitCost: 0.95, supplier: 'Golden Poultry' },
    { id: 'ing4', name: 'Cheddar & Mozzarella Mix', qty: 900, unit: 'g', minAlert: 1000, unitCost: 0.012, supplier: 'Dairy Fresh' },
    { id: 'ing5', name: 'Artisan Sourdough Slice', qty: 64, unit: 'pcs', minAlert: 20, unitCost: 0.3, supplier: 'Crust Bakery' },
    { id: 'ing6', name: 'Pizza Dough Ball (250g)', qty: 8, unit: 'pcs', minAlert: 10, unitCost: 0.55, supplier: 'In-House Prep' },
    { id: 'ing7', name: 'Shoestring Potatoes', qty: 7400, unit: 'g', minAlert: 2500, unitCost: 0.004, supplier: 'Agro Farm' },
    { id: 'ing8', name: 'Arabica Espresso & Milk Mix', qty: 12, unit: 'serv', minAlert: 15, unitCost: 0.65, supplier: 'Roast Co.' }
  ],
  menu: [
    {
      id: 'm1', code: 'BG-01', name: 'Smash Classic', category: 'Burgers', station: 'Grill',
      price: 12.5, cost: 4.2, available: true, ingredients: 7,
      desc: 'Double-smashed beef, aged cheddar, pickles and house sauce on a toasted brioche bun.',
      recipe: [{ ingId: 'ing1', qty: 1 }, { ingId: 'ing2', qty: 1 }, { ingId: 'ing4', qty: 25 }]
    },
    {
      id: 'm2', code: 'BG-02', name: 'Double Stack', category: 'Burgers', station: 'Grill',
      price: 16.0, cost: 5.4, available: true, ingredients: 9,
      desc: 'Two seared patties, smoked bacon, caramelised onion and molten American cheese.',
      recipe: [{ ingId: 'ing1', qty: 1 }, { ingId: 'ing2', qty: 2 }, { ingId: 'ing4', qty: 40 }]
    },
    {
      id: 'm3', code: 'BG-03', name: 'Truffle Mushroom', category: 'Burgers', station: 'Grill',
      price: 15.5, cost: 5.1, available: true, ingredients: 8,
      desc: 'Garlic-buttered mushrooms, truffle aioli and Swiss cheese over a flame-grilled patty.',
      recipe: [{ ingId: 'ing1', qty: 1 }, { ingId: 'ing2', qty: 1 }, { ingId: 'ing4', qty: 30 }]
    },
    {
      id: 'm4', code: 'BG-04', name: 'Crispy Chicken', category: 'Burgers', station: 'Fryer',
      price: 13.0, cost: 4.0, available: true, ingredients: 6,
      desc: 'Buttermilk-brined chicken thigh, slaw and spicy honey mayo in a potato bun.',
      recipe: [{ ingId: 'ing1', qty: 1 }, { ingId: 'ing3', qty: 1 }]
    },
    {
      id: 'm5', code: 'SW-01', name: 'Club Sandwich', category: 'Sandwiches', station: 'Grill',
      price: 11.0, cost: 3.6, available: true, ingredients: 8,
      desc: 'Triple-decker sourdough with roast chicken, bacon, tomato and herb aioli.',
      recipe: [{ ingId: 'ing5', qty: 3 }, { ingId: 'ing3', qty: 1 }, { ingId: 'ing4', qty: 30 }]
    },
    {
      id: 'm6', code: 'SW-02', name: 'Classic BLT', category: 'Sandwiches', station: 'Cold',
      price: 9.5, cost: 2.9, available: true, ingredients: 5,
      desc: 'Smoked bacon, butter lettuce and vine tomato with cracked pepper mayo.',
      recipe: [{ ingId: 'ing5', qty: 2 }, { ingId: 'ing4', qty: 15 }]
    },
    {
      id: 'm7', code: 'SW-03', name: 'Italian Sub', category: 'Sandwiches', station: 'Cold',
      price: 12.0, cost: 3.9, available: true, ingredients: 9,
      desc: 'Salami, capicola, provolone and pickled peppers on a sesame hoagie.',
      recipe: [{ ingId: 'ing5', qty: 2 }, { ingId: 'ing4', qty: 35 }]
    },
    {
      id: 'm8', code: 'SW-04', name: 'Grilled Veggie Sub', category: 'Sandwiches', station: 'Grill',
      price: 10.0, cost: 2.6, available: true, ingredients: 7,
      desc: 'Charred courgette, peppers, aubergine and hummus on toasted ciabatta.',
      recipe: [{ ingId: 'ing5', qty: 2 }, { ingId: 'ing4', qty: 25 }]
    },
    {
      id: 'm9', code: 'SD-01', name: 'Truffle Fries', category: 'Sides', station: 'Fryer',
      price: 6.5, cost: 1.4, available: true, ingredients: 4,
      desc: 'Shoestring potatoes tossed in truffle oil, parmesan and fresh parsley.',
      recipe: [{ ingId: 'ing7', qty: 220 }, { ingId: 'ing4', qty: 20 }]
    },
    {
      id: 'm10', code: 'SD-02', name: 'Peri-Peri Tenders', category: 'Sides', station: 'Fryer',
      price: 8.0, cost: 2.5, available: true, ingredients: 5,
      desc: 'Crispy chicken tenders glazed in fiery peri-peri with a cooling dip.',
      recipe: [{ ingId: 'ing3', qty: 1 }, { ingId: 'ing7', qty: 100 }]
    },

    {
      id: 'm11', code: 'PZ-01', name: 'Margherita', category: 'Pizza', station: 'Oven',
      price: 13.5, cost: 3.8, available: true, ingredients: 6,
      desc: 'San Marzano tomato, fior di latte and basil on a 48-hour fermented base.',
      recipe: [{ ingId: 'ing6', qty: 1 }, { ingId: 'ing4', qty: 100 }]
    },
    {
      id: 'm12', code: 'PZ-02', name: 'Pepperoni Honey', category: 'Pizza', station: 'Oven',
      price: 15.0, cost: 4.5, available: true, ingredients: 7,
      desc: 'Cup-and-char pepperoni, chilli honey and smoked mozzarella.',
      recipe: [{ ingId: 'ing6', qty: 1 }, { ingId: 'ing4', qty: 120 }]
    },
    {
      id: 'm13', code: 'PZ-03', name: 'Chicken Alfredo', category: 'Pizza', station: 'Grill',
      price: 14.5, cost: 4.2, available: true, ingredients: 6,
      desc: 'Fettuccine in a silky parmesan cream with grilled chicken and thyme.',
      recipe: [{ ingId: 'ing3', qty: 1 }, { ingId: 'ing4', qty: 60 }]
    },
    {
      id: 'm14', code: 'PZ-04', name: 'Arrabbiata Penne', category: 'Pizza', station: 'Grill',
      price: 12.0, cost: 3.1, available: true, ingredients: 5,
      desc: 'Penne in a slow-cooked tomato sugo with chilli, garlic and basil.',
      recipe: [{ ingId: 'ing4', qty: 45 }]
    },
    {
      id: 'm15', code: 'BV-01', name: 'Iced Spanish Latte', category: 'Beverages', station: 'Bar',
      price: 4.5, cost: 1.0, available: true, ingredients: 3,
      desc: 'Double espresso, condensed milk and ice, finished with cinnamon.',
      recipe: [{ ingId: 'ing8', qty: 1 }]
    },
    {
      id: 'm16', code: 'BV-02', name: 'Passionfruit Cooler', category: 'Beverages', station: 'Bar',
      price: 3.5, cost: 0.7, available: true, ingredients: 3,
      desc: 'Passionfruit, lime and sparkling water over crushed ice.',
      recipe: [{ ingId: 'ing8', qty: 1 }]
    },
    {
      id: 'm17', code: 'BV-03', name: 'Fresh Mint Lemonade', category: 'Beverages', station: 'Bar',
      price: 3.0, cost: 0.5, available: true, ingredients: 4,
      desc: 'Fresh mint, lemon and cane sugar shaken with still water.',
      recipe: [{ ingId: 'ing8', qty: 1 }]
    },
    {
      id: 'm18', code: 'DS-01', name: 'Dark Chocolate Tart', category: 'Desserts', station: 'Pastry',
      price: 7.0, cost: 2.0, available: true, ingredients: 6,
      desc: '70% dark chocolate ganache in a cocoa pastry shell with sea salt.',
      recipe: [{ ingId: 'ing4', qty: 20 }]
    },
    {
      id: 'm19', code: 'DS-02', name: 'Basque Cheesecake', category: 'Desserts', station: 'Pastry',
      price: 6.5, cost: 1.8, available: true, ingredients: 5,
      desc: 'Burnt-top Basque cheesecake with a soft vanilla centre.',
      recipe: [{ ingId: 'ing4', qty: 30 }]
    },
    {
      id: 'm20', code: 'DS-03', name: 'Sticky Toffee Pudding', category: 'Desserts', station: 'Pastry',
      price: 6.0, cost: 1.5, available: false, ingredients: 5,
      desc: 'Date sponge, toffee sauce and clotted cream.',
      recipe: [{ ingId: 'ing4', qty: 20 }]
    }
  ],
  tables: [
    {
      id: 'T-01', name: 'T-01', status: 'Occupied', waiter: 'Samiul Haque', guests: 3, kotStatus: 'Cooking',
      items: [
        { dishId: 'm1', name: 'Smash Classic', price: 12.5, qty: 2, station: 'Grill' },
        { dishId: 'm9', name: 'Truffle Fries', price: 6.5, qty: 1, station: 'Fryer' },
        { dishId: 'm15', name: 'Iced Spanish Latte', price: 4.5, qty: 2, station: 'Bar' }
      ]
    },
    { id: 'T-02', name: 'T-02', status: 'Available', waiter: 'Samiul Haque', guests: 0, kotStatus: 'Pending', items: [] },
    {
      id: 'T-03', name: 'T-03', status: 'Occupied', waiter: 'Samiul Haque', guests: 2, kotStatus: 'Ready',
      items: [
        { dishId: 'm5', name: 'Club Sandwich', price: 11.0, qty: 1, station: 'Grill' },
        { dishId: 'm12', name: 'Pepperoni Honey', price: 15.0, qty: 1, station: 'Oven' }
      ]
    },
    { id: 'T-04', name: 'T-04', status: 'Available', waiter: 'Samiul Haque', guests: 0, kotStatus: 'Pending', items: [] },
    { id: 'T-05', name: 'T-05', status: 'Available', waiter: 'Samiul Haque', guests: 0, kotStatus: 'Pending', items: [] },
    { id: 'T-06', name: 'T-06', status: 'Available', waiter: 'Samiul Haque', guests: 0, kotStatus: 'Pending', items: [] },
    { id: 'T-07', name: 'T-07', status: 'Available', waiter: 'Samiul Haque', guests: 0, kotStatus: 'Pending', items: [] },
    { id: 'T-08', name: 'T-08', status: 'Available', waiter: 'Samiul Haque', guests: 0, kotStatus: 'Pending', items: [] },
    { id: 'Takeaway', name: 'Takeaway', status: 'Occupied', waiter: 'Ayesha Noor', guests: 1, kotStatus: 'Pending',
      items: [
        { dishId: 'm4', name: 'Crispy Chicken', price: 13.0, qty: 1, station: 'Fryer' }
      ]
    }
  ],
  invoices: [
    {
      id: 'INV-1001', tableId: 'T-02', cashier: 'Ayesha Noor', payMethod: 'Card', createdAt: '2026-10-20 19:45',
      items: [
        { name: 'Smash Classic', qty: 2, price: 12.5 },
        { name: 'Iced Spanish Latte', qty: 2, price: 4.5 }
      ],
      subtotal: 34, discount: 2, vat: 1.6, service: 1.6, total: 35.2
    },
    {
      id: 'INV-1002', tableId: 'Takeaway', cashier: 'Ayesha Noor', payMethod: 'Cash', createdAt: '2026-10-20 20:15',
      items: [
        { name: 'Pepperoni Honey', qty: 1, price: 15 },
        { name: 'Truffle Fries', qty: 1, price: 6.5 }
      ],
      subtotal: 21.5, discount: 0, vat: 1.08, service: 0, total: 22.58
    }
  ]
};

