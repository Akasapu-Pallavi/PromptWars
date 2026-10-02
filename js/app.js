/**
 * NOVA RESCUE - Operations Dashboard Application Controller
 * Handles SPA state management, UI rendering, event listeners, interactive engine triggers,
 * live impact slider calculation, and audit logging.
 */

var globalRoot = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

// Application State
const AppState = {
  orders: [],
  selectedOrderId: 'ORD-8821', // Default selected order
  currentRecommendation: null,
  filterRisk: 'ALL',
  filterStatus: 'ALL',
  searchQuery: '',
  hypotheticalRescueRate: 30, // Default 30%
  sessionRescuedCount: 0,
  sessionPreservedRevenue: 0,
  auditLog: []
};

globalRoot.AppState = AppState;


// DOM Elements Cache
let DOM = {};

function createEl(tag, props, ...children) {
  const node = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (value == null || value === false) return;
      if (key === 'className') {
        node.className = value;
      } else if (key === 'textContent') {
        node.textContent = value;
      } else if (key === 'dataset') {
        Object.keys(value).forEach((dataKey) => {
          node.dataset[dataKey] = value[dataKey];
        });
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(node.style, value);
      } else if (typeof value === 'function' && key.length > 2 && key.slice(0, 2) === 'on') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        node.setAttribute(key, value === true ? '' : String(value));
      }
    });
  }
  children.flat().forEach((child) => {
    if (child == null || child === false) return;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return node;
}

function getOrderRisk(order) {
  return NOVAEngine.calculateRiskScore(order);
}

function filterOrders(orders, searchQuery, filterRisk, filterStatus) {
  const q = (searchQuery || '').trim().toLowerCase();
  return orders.filter((order) => {
    if (filterRisk !== 'ALL' && getOrderRisk(order).level !== filterRisk) return false;
    if (filterStatus !== 'ALL' && order.status !== filterStatus) return false;
    if (q) {
      const matchesId = order.id.toLowerCase().includes(q);
      const matchesCustomer = order.customer.name.toLowerCase().includes(q);
      const matchesStore = order.store.name.toLowerCase().includes(q);
      if (!matchesId && !matchesCustomer && !matchesStore) return false;
    }
    return true;
  });
}

function computeImpactScenario(ratePct, metrics) {
  const m = metrics || NOVACartData.metrics;
  const totalAvailabilityCancellations = Math.round(m.monthlyOrders * m.cancellationRate * m.unavailabilityCancellationShare);
  const rescuedOrdersMonthly = Math.round(totalAvailabilityCancellations * (ratePct / 100));
  const monthlyValuePreserved = Math.round(rescuedOrdersMonthly * m.averageOrderValue);
  const annualValuePreserved = monthlyValuePreserved * 12;
  return {
    totalAvailabilityCancellations,
    rescuedOrdersMonthly,
    monthlyValuePreserved,
    annualValuePreserved
  };
}

function applyRescueAction(order, rec) {
  if (!order || order.status === 'Rescued') return false;

  order.status = 'Rescued';
  AppState.sessionRescuedCount += 1;
  AppState.sessionPreservedRevenue += order.orderValue;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  AppState.auditLog.unshift({
    id: order.id,
    actionTitle: rec.actionTitle,
    orderValue: order.orderValue,
    customerName: order.customer.name,
    timestamp
  });

  return true;
}

function resetDemoState() {
  AppState.orders = JSON.parse(JSON.stringify(NOVACartData.orders));
  AppState.selectedOrderId = 'ORD-8821';
  AppState.currentRecommendation = null;
  AppState.filterRisk = 'ALL';
  AppState.filterStatus = 'ALL';
  AppState.searchQuery = '';
  AppState.hypotheticalRescueRate = 30;
  AppState.sessionRescuedCount = 0;
  AppState.sessionPreservedRevenue = 0;
  AppState.auditLog = [];
}

// Initialize Application
function initApp() {
  // Deep clone data from NOVACartData
  if (typeof NOVACartData !== 'undefined' && NOVACartData.orders) {
    AppState.orders = JSON.parse(JSON.stringify(NOVACartData.orders));
  }

  DOM = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Command Center KPIs
    metricRescuedCount: document.getElementById('metric-rescued-count'),
    metricPreservedRev: document.getElementById('metric-preserved-rev'),
    metricActiveAtRisk: document.getElementById('metric-active-at-risk'),
    metricQueueBadge: document.getElementById('queue-badge'),
    
    // Queue Controls
    queueTableBody: document.getElementById('queue-table-body'),
    searchInput: document.getElementById('search-input'),
    riskFilterBtns: document.querySelectorAll('.btn-filter[data-risk]'),
    statusFilterBtns: document.querySelectorAll('.btn-filter[data-status]'),
    
    // Workbench Details
    wbOrderId: document.getElementById('wb-order-id'),
    wbCustomerName: document.getElementById('wb-customer-name'),
    wbCustomerPhone: document.getElementById('wb-customer-phone'),
    wbCustomerLtv: document.getElementById('wb-customer-ltv'),
    wbStoreName: document.getElementById('wb-store-name'),
    wbStoreId: document.getElementById('wb-store-id'),
    wbOrderValue: document.getElementById('wb-order-value'),
    wbEta: document.getElementById('wb-eta'),
    wbRiskLevel: document.getElementById('wb-risk-level'),
    wbRiskScore: document.getElementById('wb-risk-score'),
    wbItemsList: document.getElementById('wb-items-list'),
    wbFailureDesc: document.getElementById('wb-failure-desc'),
    
    // Action Container
    btnAnalyze: document.getElementById('btn-analyze'),
    recCardContainer: document.getElementById('rec-card-container'),
    
    // Impact Calculator
    rescueSlider: document.getElementById('rescue-slider'),
    sliderValDisplay: document.getElementById('slider-val-display'),
    calcRescueEffLabel: document.getElementById('calc-rescue-eff-label'),
    calcRescuedOrders: document.getElementById('calc-rescued-orders'),
    calcMonthlyRevenue: document.getElementById('calc-monthly-revenue'),
    calcAnnualRevenue: document.getElementById('calc-annual-revenue'),

    // Audit Feed
    auditFeedList: document.getElementById('audit-feed-list'),
    toastContainer: document.getElementById('toast-container')
  };

  setupTabListeners();
  setupQueueControls();
  setupImpactSlider();
  renderAll();
}

// Setup Tab Navigation
function setupTabListeners() {
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      DOM.tabBtns.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
      DOM.tabContents.forEach(c => {
        const isActive = c.id === `tab-${targetTab}`;
        c.classList.toggle('active', isActive);
        if (isActive) {
          c.removeAttribute('hidden');
        } else {
          c.setAttribute('hidden', '');
        }
      });
    });
  });
}

// Setup Queue Search & Filters
function setupQueueControls() {
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.trim().toLowerCase();
      renderQueueTable();
    });
  }

  DOM.riskFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.riskFilterBtns.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      AppState.filterRisk = btn.getAttribute('data-risk');
      renderQueueTable();
    });
  });

  DOM.statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.statusFilterBtns.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      AppState.filterStatus = btn.getAttribute('data-status');
      renderQueueTable();
    });
  });

  if (DOM.btnAnalyze) {
    DOM.btnAnalyze.addEventListener('click', handleAnalyzeAndRescue);
  }
}

// Setup Impact Slider Listener
function setupImpactSlider() {
  if (DOM.rescueSlider) {
    DOM.rescueSlider.addEventListener('input', (e) => {
      AppState.hypotheticalRescueRate = parseInt(e.target.value, 10);
      renderImpactCalculator();
    });
  }
}

function selectQueueOrder(orderId) {
  AppState.selectedOrderId = orderId;
  AppState.currentRecommendation = null;
  renderQueueTable();
  renderOrderWorkbench();
}

// Render Master UI
function renderAll() {
  renderCommandCenterKPIs();
  renderQueueTable();
  renderOrderWorkbench();
  renderImpactCalculator();
  renderAuditFeed();
}

// Render Command Center Top Bar KPIs
function renderCommandCenterKPIs() {
  if (!DOM.metricActiveAtRisk) return;
  const atRiskCount = AppState.orders.filter(o => o.status === 'At Risk').length;
  DOM.metricActiveAtRisk.textContent = atRiskCount;
  if (DOM.metricQueueBadge) DOM.metricQueueBadge.textContent = `${atRiskCount} At Risk`;
  if (DOM.metricRescuedCount) DOM.metricRescuedCount.textContent = AppState.sessionRescuedCount;
  if (DOM.metricPreservedRev) DOM.metricPreservedRev.textContent = `₹${AppState.sessionPreservedRevenue.toLocaleString('en-IN')}`;
}

// Render Queue Table
function renderQueueTable() {
  if (!DOM.queueTableBody) return;

  const filtered = filterOrders(
    AppState.orders,
    AppState.searchQuery,
    AppState.filterRisk,
    AppState.filterStatus
  );

  DOM.queueTableBody.textContent = '';

  if (filtered.length === 0) {
    const emptyRow = createEl('tr', null,
      createEl('td', {
        colspan: '7',
        style: { textAlign: 'center', color: 'var(--text-sub)', padding: '2rem' },
        textContent: 'No orders match current search or filter criteria.'
      })
    );
    DOM.queueTableBody.appendChild(emptyRow);
    return;
  }

  filtered.forEach((order) => {
    const isSelected = order.id === AppState.selectedOrderId;
    const riskData = getOrderRisk(order);
    const riskBadgeClass = riskData.level === 'High' ? 'badge-danger' : (riskData.level === 'Medium' ? 'badge-warning' : 'badge-emerald');
    const statusBadgeClass = order.status === 'Rescued' ? 'badge-emerald' : 'badge-danger';
    const minConfidence = Math.min(...order.items.map(i => i.inventoryConfidence));
    const confColor = minConfidence < 25 ? 'var(--rose)' : (minConfidence < 50 ? 'var(--amber)' : 'var(--emerald)');

    const row = createEl('tr', {
      className: isSelected ? 'selected' : '',
      dataset: { orderId: order.id },
      tabindex: '0',
      'aria-selected': isSelected ? 'true' : 'false',
      'aria-label': `Select order ${order.id}, ${order.customer.name}, ${riskData.level} risk, ${order.status}`
    });

    row.appendChild(createEl('td', {
      style: { fontWeight: '700', color: 'var(--primary)' },
      textContent: order.id
    }));

    const customerCell = createEl('td');
    customerCell.appendChild(createEl('div', { style: { fontWeight: '600' }, textContent: order.customer.name }));
    customerCell.appendChild(createEl('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, textContent: `${order.customer.completedOrders} orders` }));
    row.appendChild(customerCell);

    const storeCell = createEl('td');
    storeCell.appendChild(createEl('div', { style: { fontWeight: '600' }, textContent: order.store.name }));
    storeCell.appendChild(createEl('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, textContent: order.store.id }));
    row.appendChild(storeCell);

    row.appendChild(createEl('td', {
      style: { fontWeight: '700', color: confColor },
      textContent: `${minConfidence}% Stock Conf.`
    }));
    row.appendChild(createEl('td', { style: { fontWeight: '700' }, textContent: `₹${order.orderValue}` }));

    const riskCell = createEl('td');
    riskCell.appendChild(createEl('span', {
      className: `badge ${riskBadgeClass}`,
      textContent: riskData.level,
      'aria-label': `Risk level ${riskData.level}`
    }));
    row.appendChild(riskCell);

    const statusCell = createEl('td');
    statusCell.appendChild(createEl('span', {
      className: `badge ${statusBadgeClass}`,
      textContent: order.status,
      'aria-label': `Order status ${order.status}`
    }));
    row.appendChild(statusCell);

    row.addEventListener('click', () => selectQueueOrder(order.id));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectQueueOrder(order.id);
      }
    });

    DOM.queueTableBody.appendChild(row);
  });
}

// Render Order Detail Workbench
function renderOrderWorkbench() {
  if (!DOM.wbOrderId) return;
  const order = AppState.orders.find(o => o.id === AppState.selectedOrderId);
  if (!order) return;

  const riskData = getOrderRisk(order);

  DOM.wbOrderId.textContent = order.id;
  DOM.wbCustomerName.textContent = order.customer.name;
  DOM.wbCustomerPhone.textContent = order.customer.phone;
  DOM.wbCustomerLtv.textContent = order.customer.ltvCategory;
  DOM.wbStoreName.textContent = order.store.name;
  DOM.wbStoreId.textContent = order.store.id;
  DOM.wbOrderValue.textContent = `₹${order.orderValue}`;
  DOM.wbEta.textContent = `${order.currentEtaMins} mins`;
  
  // Risk Badges
  const riskBadgeClass = riskData.level === 'High' ? 'badge-danger' : (riskData.level === 'Medium' ? 'badge-warning' : 'badge-emerald');
  DOM.wbRiskLevel.className = `badge ${riskBadgeClass}`;
  DOM.wbRiskLevel.textContent = `${riskData.level} Risk`;
  DOM.wbRiskLevel.setAttribute('aria-label', `Engine risk level ${riskData.level}, score ${riskData.score} out of 100`);
  DOM.wbRiskScore.textContent = `${riskData.score}/100`;

  DOM.wbFailureDesc.textContent = order.failureDescription;

  DOM.wbItemsList.textContent = '';
  order.items.forEach((item) => {
    const confColor = item.inventoryConfidence < 25 ? 'var(--rose)' : (item.inventoryConfidence < 50 ? 'var(--amber)' : 'var(--emerald)');
    const stockLabel = item.inStock ? 'Verified Stock' : 'Unconfirmed Stock';
    const stockClass = item.inStock ? 'badge-emerald' : 'badge-danger';

    const row = createEl('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.65rem 0',
        borderBottom: '1px solid var(--border-color)'
      }
    });

    const left = createEl('div');
    left.appendChild(createEl('div', { style: { fontWeight: '600', color: 'var(--text-main)' }, textContent: `${item.name} (x${item.qty})` }));
    left.appendChild(createEl('div', { style: { fontSize: '0.775rem', color: 'var(--text-sub)' }, textContent: `Unit Price: ₹${item.unitPrice}` }));

    const right = createEl('div', { style: { textAlign: 'right' } });
    right.appendChild(createEl('div', null, createEl('span', {
      className: `badge ${stockClass}`,
      textContent: stockLabel,
      'aria-label': `${item.name} ${stockLabel.toLowerCase()}`
    })));
    right.appendChild(createEl('div', {
      style: { fontSize: '0.75rem', fontWeight: '700', color: confColor, marginTop: '0.2rem' },
      textContent: `${item.inventoryConfidence}% Confidence`
    }));

    row.appendChild(left);
    row.appendChild(right);
    DOM.wbItemsList.appendChild(row);
  });

  // If order is already Rescued, disable Analyze or show Rescued Notice
  if (order.status === 'Rescued') {
    DOM.btnAnalyze.disabled = true;
    DOM.btnAnalyze.textContent = 'Order Already Rescued';
    DOM.btnAnalyze.setAttribute('aria-disabled', 'true');

    const rescuedNotice = createEl('div', { className: 'alert-callout emerald', style: { marginTop: '1rem' }, role: 'status' });
    rescuedNotice.appendChild(createEl('div', { textContent: `Order ${order.id} is Rescued!` }));
    rescuedNotice.appendChild(createEl('div', {
      style: { marginTop: '0.2rem', fontSize: '0.85rem' },
      textContent: 'Fulfillment decision executed cleanly. Dashboard metrics updated live.'
    }));
    DOM.recCardContainer.textContent = '';
    DOM.recCardContainer.appendChild(rescuedNotice);
  } else {
    DOM.btnAnalyze.disabled = false;
    DOM.btnAnalyze.textContent = '⚡ Analyze & Rescue Order';
    DOM.btnAnalyze.setAttribute('aria-disabled', 'false');
    
    if (!AppState.currentRecommendation) {
      const placeholder = createEl('div', {
        style: {
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '2rem',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginTop: '1rem'
        }
      });
      placeholder.appendChild(document.createTextNode('Click '));
      placeholder.appendChild(createEl('strong', { textContent: '"⚡ Analyze & Rescue Order"' }));
      placeholder.appendChild(document.createTextNode(' to run the deterministic decision engine and evaluate optimal recovery options.'));
      DOM.recCardContainer.textContent = '';
      DOM.recCardContainer.appendChild(placeholder);
    } else {
      renderRecommendationCard(AppState.currentRecommendation, order);
    }
  }
}

// Handle "Analyze & Rescue" Engine Execution
function handleAnalyzeAndRescue() {
  const order = AppState.orders.find(o => o.id === AppState.selectedOrderId);
  if (!order || order.status === 'Rescued') return;

  // Run Deterministic Decision Engine
  const recommendation = NOVAEngine.analyzeOrder(order);
  AppState.currentRecommendation = recommendation;

  renderRecommendationCard(recommendation, order);
}

// Render Engine Output Recommendation Card
function renderRecommendationCard(rec, order) {
  const card = createEl('div', { className: 'recommendation-card', role: 'region', 'aria-label': 'Rescue recommendation' });

  const header = createEl('div', { className: 'rec-header' });
  const headerInner = createEl('div');
  headerInner.appendChild(createEl('span', { className: `badge ${rec.badgeClass}`, textContent: rec.actionBadge }));
  headerInner.appendChild(createEl('h3', { className: 'rec-title', style: { marginTop: '0.4rem' }, textContent: rec.actionTitle }));
  header.appendChild(headerInner);
  card.appendChild(header);

  const reason = createEl('div', { className: 'rec-reason' });
  reason.appendChild(createEl('strong', { textContent: 'Deterministic Logic Rationale:' }));
  reason.appendChild(document.createElement('br'));
  reason.appendChild(document.createTextNode(rec.reason));
  card.appendChild(reason);

  if (rec.alternativeDetails) {
    const altBox = createEl('div', {
      style: {
        background: 'var(--bg-dark)',
        padding: '0.85rem',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1rem',
        border: '1px solid var(--border-color)'
      }
    });
    altBox.appendChild(createEl('div', {
      style: { fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.4rem' },
      textContent: 'Alternative Option Details'
    }));
    Object.keys(rec.alternativeDetails).forEach((key) => {
      const label = key.replace(/([A-Z])/g, ' $1');
      const row = createEl('div', {
        style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }
      });
      row.appendChild(createEl('span', { style: { color: 'var(--text-sub)', textTransform: 'capitalize' }, textContent: `${label}:` }));
      row.appendChild(createEl('span', { style: { color: 'var(--text-main)', fontWeight: '600' }, textContent: String(rec.alternativeDetails[key]) }));
      altBox.appendChild(row);
    });
    card.appendChild(altBox);
  }

  const impactGrid = createEl('div', { className: 'impact-grid' });
  [
    ['ETA Impact', rec.etaImpact],
    ['Customer Retention', rec.customerImpact],
    ['Business Value', rec.businessImpact]
  ].forEach(([label, value]) => {
    const box = createEl('div', { className: 'impact-box' });
    box.appendChild(createEl('div', { className: 'impact-box-label', textContent: label }));
    box.appendChild(createEl('div', { className: 'impact-box-val', textContent: value }));
    impactGrid.appendChild(box);
  });
  card.appendChild(impactGrid);

  const actionWrap = createEl('div', { style: { marginTop: '1.25rem' } });
  const btnApply = createEl('button', {
    id: 'btn-apply-rescue',
    className: 'btn-action emerald',
    type: 'button',
    style: { width: '100%' },
    textContent: `✓ Apply Rescue Action (${order.id})`,
    'aria-label': `Apply rescue action for order ${order.id}`
  });
  btnApply.addEventListener('click', () => handleApplyRescue(order, rec));
  actionWrap.appendChild(btnApply);
  card.appendChild(actionWrap);

  DOM.recCardContainer.textContent = '';
  DOM.recCardContainer.appendChild(card);
}

// Handle "Apply Rescue"
function handleApplyRescue(order, rec) {
  if (!applyRescueAction(order, rec)) return;

  showToast(`Order ${order.id} Rescued! ₹${order.orderValue} order value preserved.`);

  AppState.currentRecommendation = null;
  renderAll();
}

// Render Business Impact Calculator (Interactive Scenario Math)
function renderImpactCalculator() {
  if (!DOM.sliderValDisplay) return;
  const ratePct = AppState.hypotheticalRescueRate;
  DOM.sliderValDisplay.textContent = `${ratePct}% Rescue Target`;

  const scenario = computeImpactScenario(ratePct, NOVACartData.metrics);
  const rescuedOrdersMonthly = scenario.rescuedOrdersMonthly;
  const monthlyValuePreserved = scenario.monthlyValuePreserved;
  const annualValuePreserved = scenario.annualValuePreserved;

  if (DOM.rescueSlider) {
    DOM.rescueSlider.setAttribute('aria-valuenow', String(ratePct));
    DOM.rescueSlider.setAttribute('aria-valuetext', `${ratePct} percent rescue target`);
  }
  if (DOM.calcRescueEffLabel) DOM.calcRescueEffLabel.textContent = ratePct === 30 ? '30% Default Target' : `${ratePct}% Target`;
  if (DOM.calcRescuedOrders) DOM.calcRescuedOrders.textContent = `${rescuedOrdersMonthly.toLocaleString('en-IN')} Orders / Mo`;
  if (DOM.calcMonthlyRevenue) DOM.calcMonthlyRevenue.textContent = `₹${(monthlyValuePreserved / 100000).toFixed(2)} Lakh / Mo (₹${monthlyValuePreserved.toLocaleString('en-IN')})`;
  if (DOM.calcAnnualRevenue) DOM.calcAnnualRevenue.textContent = `₹${(annualValuePreserved / 100000).toFixed(2)} Lakh / Year`;
}

// Render Session Audit Feed
function renderAuditFeed() {
  if (!DOM.auditFeedList) return;

  DOM.auditFeedList.textContent = '';

  if (AppState.auditLog.length === 0) {
    DOM.auditFeedList.appendChild(createEl('div', {
      style: { color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' },
      textContent: 'No rescue actions applied yet in this session.'
    }));
    return;
  }

  AppState.auditLog.forEach((item) => {
    const row = createEl('div', {
      style: {
        padding: '0.65rem 0',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.85rem'
      }
    });

    const left = createEl('div');
    const titleLine = createEl('div');
    titleLine.appendChild(createEl('span', { style: { fontWeight: '700', color: 'var(--emerald)' }, textContent: item.id }));
    titleLine.appendChild(document.createTextNode(' — '));
    titleLine.appendChild(createEl('span', { style: { color: 'var(--text-main)', fontWeight: '600' }, textContent: item.actionTitle }));
    left.appendChild(titleLine);
    left.appendChild(createEl('div', { style: { fontSize: '0.75rem', color: 'var(--text-sub)' }, textContent: item.customerName }));

    const right = createEl('div', { style: { textAlign: 'right' } });
    right.appendChild(createEl('div', { style: { fontWeight: '700', color: 'var(--emerald)' }, textContent: `+₹${item.orderValue}` }));
    right.appendChild(createEl('div', { style: { fontSize: '0.7rem', color: 'var(--text-muted)' }, textContent: item.timestamp }));

    row.appendChild(left);
    row.appendChild(right);
    DOM.auditFeedList.appendChild(row);
  });
}

// Show Toast Notification
function showToast(message) {
  if (!DOM.toastContainer) return;
  const toast = createEl('div', { className: 'toast', role: 'status' });
  toast.appendChild(createEl('span', {
    style: { color: 'var(--emerald)', fontSize: '1.1rem' },
    'aria-hidden': 'true',
    textContent: '✓'
  }));
  toast.appendChild(createEl('span', { textContent: message }));

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

var NOVAApp = {
  AppState,
  getOrderRisk,
  filterOrders,
  computeImpactScenario,
  applyRescueAction,
  resetDemoState,
  initApp
};
globalRoot.NOVAApp = NOVAApp;

// Initialization Hook
if (typeof document !== 'undefined') {
  if (document.getElementById('queue-table-body')) {
    initApp();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
