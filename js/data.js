/**
 * NOVA CART Case Data & Demo Dataset
 * Contains official case stats, store network, product catalog, and realistic demo orders.
 */

var globalRoot = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

var NOVACartData = globalRoot.NOVACartData = {
  // Official Case Facts
  metrics: {
    partnerStores: 620,
    registeredUsers: 120000,
    monthlyActiveUsers: 46000,
    monthlyOrders: 38500,
    averageOrderValue: 486, // ₹
    cancellationRate: 0.11, // 11%
    unavailabilityCancellationShare: 0.35, // 35% of cancellations
    phantomAvailabilityRate: 0.29, // 29% report phantom stock
    repeatSearchUnavailableRate: 0.19, // 19% repeatedly search unavailable items
    storeInventoryBurdenRate: 0.39, // 39% stores find inventory management hard
    storeRejectionRate: 0.23, // 23% stores occasionally reject orders
    monthlySupportTickets: 5900, // up from 3,100
    unavailableSupportTicketShare: 0.19, // 19% of support tickets
    avgSupportResolutionHours: 9.2,
    repeatOrderProbability3Orders: 0.72 // 72% probability after 3 orders
  },

  // Stores Network
  stores: [
    { id: 'STR-101', name: 'FreshMart Koramangala', zone: 'South Bangalore', rating: 4.8, distanceKm: 0.0, avgPrepMins: 8, rejectionRisk: 'Low' },
    { id: 'STR-104', name: 'FreshMart Indiranagar', zone: 'East Bangalore', rating: 4.9, distanceKm: 1.8, avgPrepMins: 6, rejectionRisk: 'Low' },
    { id: 'STR-108', name: 'DailyNeeds HSR Layout', zone: 'South Bangalore', rating: 4.2, distanceKm: 0.0, avgPrepMins: 12, rejectionRisk: 'Medium' },
    { id: 'STR-112', name: 'DailyNeeds Silk Board', zone: 'South Bangalore', rating: 4.6, distanceKm: 2.2, avgPrepMins: 7, rejectionRisk: 'Low' },
    { id: 'STR-201', name: 'QuickBazaar Indiranagar', zone: 'East Bangalore', rating: 4.0, distanceKm: 0.0, avgPrepMins: 15, rejectionRisk: 'High' },
    { id: 'STR-205', name: 'GreenGrocers Jayanagar', zone: 'South Bangalore', rating: 4.5, distanceKm: 0.0, avgPrepMins: 10, rejectionRisk: 'Medium' },
    { id: 'STR-302', name: 'LocalMart JP Nagar', zone: 'South Bangalore', rating: 3.9, distanceKm: 0.0, avgPrepMins: 14, rejectionRisk: 'High' },
    { id: 'STR-309', name: 'LocalMart BTM Layout', zone: 'South Bangalore', rating: 4.7, distanceKm: 2.1, avgPrepMins: 8, rejectionRisk: 'Low' }
  ],

  // Sample At-Risk Demo Orders
  orders: [
    {
      id: 'ORD-8821',
      customer: { name: 'Ananya Sharma', phone: '+91 XXXX XXX 210', completedOrders: 2, ltvCategory: 'High LTV Conversion Risk (3rd Order Hook)' },
      store: { id: 'STR-101', name: 'FreshMart Koramangala' },
      items: [
        { name: 'Organic Whole Milk 1L', qty: 2, unitPrice: 75, inStock: false, inventoryConfidence: 18 },
        { name: 'Multigrain Bread 400g', qty: 1, unitPrice: 50, inStock: true, inventoryConfidence: 95 }
      ],
      currentEtaMins: 18,
      orderValue: 200,
      status: 'At Risk', // 'At Risk' | 'Rescued'
      primaryFailureMode: 'UNAVAILABLE_ITEM',
      failureDescription: 'Primary item "Organic Whole Milk 1L" is out of stock (18% confidence). Store #101 inventory sync lagging.',
      timeElapsedMins: 6,
    },
    {
      id: 'ORD-8824',
      customer: { name: 'Rahul Verma', phone: '+91 XXXX XXX 678', completedOrders: 5, ltvCategory: 'Established Repeat Buyer', acceptsSubstitutions: true },
      store: { id: 'STR-108', name: 'DailyNeeds HSR Layout' },
      items: [
        { name: 'Farm Fresh Eggs (12pk)', qty: 1, unitPrice: 90, inStock: false, inventoryConfidence: 32 },
        { name: 'Amul Butter 500g', qty: 1, unitPrice: 275, inStock: true, inventoryConfidence: 98 },
        { name: 'Curd 500g', qty: 2, unitPrice: 40, inStock: true, inventoryConfidence: 90 }
      ],
      currentEtaMins: 22,
      orderValue: 445,
      status: 'At Risk',
      primaryFailureMode: 'UNAVAILABLE_ITEM',
      failureDescription: 'Item "Farm Fresh Eggs (12pk)" unconfirmed. Store reports physical stock depleted.',
      timeElapsedMins: 8,
    },
    {
      id: 'ORD-8827',
      customer: { name: 'Priya Nair', phone: '+91 XXXX XXX 109', completedOrders: 2, ltvCategory: 'High LTV Conversion Risk (3rd Order Hook)' },
      store: { id: 'STR-201', name: 'QuickBazaar Indiranagar' },
      items: [
        { name: 'Fresh Paneer 200g', qty: 2, unitPrice: 120, inStock: true, inventoryConfidence: 85 },
        { name: 'Capsicum Green 250g', qty: 1, unitPrice: 45, inStock: true, inventoryConfidence: 90 }
      ],
      currentEtaMins: 35,
      orderValue: 285,
      status: 'At Risk',
      primaryFailureMode: 'STORE_DISPATCH_DELAY',
      failureDescription: 'Store #201 prep delay (+15 mins). High historical order rejection risk (23%).',
      timeElapsedMins: 14,
    },
    {
      id: 'ORD-8830',
      customer: { name: 'Vikram Sethi', phone: '+91 XXXX XXX 655', completedOrders: 12, ltvCategory: 'VIP Customer' },
      store: { id: 'STR-205', name: 'GreenGrocers Jayanagar' },
      items: [
        { name: 'Hass Avocado (2pk)', qty: 2, unitPrice: 290, inStock: false, inventoryConfidence: 12 },
        { name: 'Epigamia Greek Yogurt 400g', qty: 2, unitPrice: 180, inStock: false, inventoryConfidence: 15 },
        { name: 'Blueberries 125g', qty: 1, unitPrice: 300, inStock: true, inventoryConfidence: 88 }
      ],
      currentEtaMins: 28,
      orderValue: 1240,
      status: 'At Risk',
      primaryFailureMode: 'MULTI_ITEM_OOS',
      failureDescription: 'Multiple premium items out of stock across local store network. High basket value at risk.',
      timeElapsedMins: 11,
    },
    {
      id: 'ORD-8833',
      customer: { name: 'Meera Deshmukh', phone: '+91 XXXX XXX 098', completedOrders: 1, ltvCategory: 'New Customer (1st Order)' },
      store: { id: 'STR-302', name: 'LocalMart JP Nagar' },
      items: [
        { name: 'Toned Milk 1L', qty: 2, unitPrice: 56, inStock: false, inventoryConfidence: 22 },
        { name: 'White Bread 400g', qty: 1, unitPrice: 40, inStock: true, inventoryConfidence: 90 }
      ],
      currentEtaMins: 19,
      orderValue: 152,
      status: 'At Risk',
      primaryFailureMode: 'STORE_REJECTION_RISK',
      failureDescription: 'Store #302 stock confidence low (22%) and store rejection risk is High.',
      timeElapsedMins: 5,
    },
    {
      id: 'ORD-8836',
      customer: { name: 'Karan Patel', phone: '+91 XXXX XXX 987', completedOrders: 4, ltvCategory: 'Established Repeat Buyer', acceptsSubstitutions: true },
      store: { id: 'STR-101', name: 'FreshMart Koramangala' },
      items: [
        { name: 'Raw Pressery Almond Milk 1L', qty: 1, unitPrice: 220, inStock: false, inventoryConfidence: 28 },
        { name: 'Granola Oats 500g', qty: 1, unitPrice: 310, inStock: true, inventoryConfidence: 96 }
      ],
      currentEtaMins: 24,
      orderValue: 530,
      status: 'At Risk',
      primaryFailureMode: 'UNAVAILABLE_ITEM',
      failureDescription: 'Item "Raw Pressery Almond Milk 1L" unavailable. Alternative substitute available in stock.',
      timeElapsedMins: 7,
    },
    {
      id: 'ORD-8839',
      customer: { name: 'Siddharth Rao', phone: '+91 XXXX XXX 876', completedOrders: 8, ltvCategory: 'Regular Active Buyer' },
      store: { id: 'STR-104', name: 'FreshMart Indiranagar' },
      items: [
        { name: 'Fresh Tomatoes 1kg', qty: 1, unitPrice: 48, inStock: true, inventoryConfidence: 94 },
        { name: 'Onions 1kg', qty: 1, unitPrice: 42, inStock: true, inventoryConfidence: 98 },
        { name: 'Potatoes 1kg', qty: 1, unitPrice: 38, inStock: true, inventoryConfidence: 96 }
      ],
      currentEtaMins: 38,
      orderValue: 128,
      status: 'At Risk',
      primaryFailureMode: 'DELIVERY_ETA_SPIKE',
      failureDescription: 'Traffic congestion adding +12 mins to ETA. Risk of customer cancellation due to delay.',
      timeElapsedMins: 16,
    },
    {
      id: 'ORD-8842',
      customer: { name: 'Deepa Roy', phone: '+91 XXXX XXX 765', completedOrders: 2, ltvCategory: 'High LTV Conversion Risk (3rd Order Hook)' },
      store: { id: 'STR-302', name: 'LocalMart JP Nagar' },
      items: [
        { name: 'Malai Paneer 200g', qty: 2, unitPrice: 135, inStock: false, inventoryConfidence: 15 },
        { name: 'Green Peas 500g', qty: 1, unitPrice: 85, inStock: true, inventoryConfidence: 88 }
      ],
      currentEtaMins: 20,
      orderValue: 355,
      status: 'At Risk',
      primaryFailureMode: 'UNAVAILABLE_ITEM',
      failureDescription: 'Primary item "Malai Paneer 200g" unconfirmed. Nearby Store #309 has 96% stock confidence.',
      timeElapsedMins: 9,
    }
  ],

  // Available Substitutes Catalog mapping
  substitutes: {
    'Organic Whole Milk 1L': [
      { name: 'Amul Taaza Toned Milk 1L', brand: 'Amul', unitPrice: 72, stockConfidence: 98, storeId: 'STR-101' },
      { name: 'Nandini GoodLife T-Special 1L', brand: 'Nandini', unitPrice: 68, stockConfidence: 95, storeId: 'STR-101' }
    ],
    'Farm Fresh Eggs (12pk)': [
      { name: 'Organic Free Range Eggs (10pk)', brand: 'Eggoz', unitPrice: 105, stockConfidence: 96, storeId: 'STR-108' },
      { name: 'Classic Brown Eggs (10pk)', brand: 'Country Eggs', unitPrice: 88, stockConfidence: 94, storeId: 'STR-108' }
    ],
    'Raw Pressery Almond Milk 1L': [
      { name: 'So Good Oat Milk Unsweetened 1L', brand: 'So Good', unitPrice: 210, stockConfidence: 94, storeId: 'STR-101' },
      { name: 'Hershey Almond Milk 1L', brand: 'Hershey', unitPrice: 230, stockConfidence: 91, storeId: 'STR-101' }
    ],
    'Hass Avocado (2pk)': [
      { name: 'Indian Butter Fruit / Avocado 500g', brand: 'Fresh Farm', unitPrice: 240, stockConfidence: 85, storeId: 'STR-205' }
    ],
    'Epigamia Greek Yogurt 400g': [
      { name: 'Milky Mist Plain Greek Yogurt 400g', brand: 'Milky Mist', unitPrice: 160, stockConfidence: 95, storeId: 'STR-205' }
    ],
    'Toned Milk 1L': [
      { name: 'Nandini Milk 1L', brand: 'Nandini', unitPrice: 52, stockConfidence: 99, storeId: 'STR-302' }
    ],
    'Malai Paneer 200g': [
      { name: 'Amul Fresh Paneer 200g', brand: 'Amul', unitPrice: 125, stockConfidence: 96, storeId: 'STR-309' }
    ]
  }
};

globalRoot.NOVACartData = NOVACartData;
