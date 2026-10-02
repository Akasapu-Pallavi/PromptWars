/**
 * NOVA RESCUE - Operations Dashboard Application Controller
 * Handles SPA state management, UI rendering, event listeners, interactive engine triggers,
 * live impact slider calculation, and audit logging.
 */

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

if (typeof window !== 'undefined') {
  window.AppState = AppState;
}


// DOM Elements Cache
let DOM = {};

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
      
      DOM.tabBtns.forEach(b => b.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const contentEl = document.getElementById(`tab-${targetTab}`);
      if (contentEl) contentEl.classList.add('active');
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
      DOM.riskFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.filterRisk = btn.getAttribute('data-risk');
      renderQueueTable();
    });
  });

  DOM.statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.statusFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

  const filtered = AppState.orders.filter(order => {
    // Risk Filter
    if (AppState.filterRisk !== 'ALL' && order.riskLevel !== AppState.filterRisk) return false;
    // Status Filter
    if (AppState.filterStatus !== 'ALL' && order.status !== AppState.filterStatus) return false;
    // Search Query
    if (AppState.searchQuery) {
      const q = AppState.searchQuery;
      const matchesId = order.id.toLowerCase().includes(q);
      const matchesCustomer = order.customer.name.toLowerCase().includes(q);
      const matchesStore = order.store.name.toLowerCase().includes(q);
      if (!matchesId && !matchesCustomer && !matchesStore) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    DOM.queueTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-sub); padding: 2rem;">
          No orders match current search or filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  DOM.queueTableBody.innerHTML = filtered.map(order => {
    const isSelected = order.id === AppState.selectedOrderId;
    const riskBadgeClass = order.riskLevel === 'High' ? 'badge-danger' : (order.riskLevel === 'Medium' ? 'badge-warning' : 'badge-emerald');
    const statusBadgeClass = order.status === 'Rescued' ? 'badge-emerald' : 'badge-danger';
    const minConfidence = Math.min(...order.items.map(i => i.inventoryConfidence));
    const confBadgeClass = minConfidence < 25 ? 'color: var(--rose)' : (minConfidence < 50 ? 'color: var(--amber)' : 'color: var(--emerald)');

    return `
      <tr class="${isSelected ? 'selected' : ''}" data-order-id="${order.id}">
        <td style="font-weight: 700; color: var(--primary);">${order.id}</td>
        <td>
          <div style="font-weight: 600;">${order.customer.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${order.customer.completedOrders} orders</div>
        </td>
        <td>
          <div style="font-weight: 600;">${order.store.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${order.store.id}</div>
        </td>
        <td style="font-weight: 700; ${confBadgeClass}">${minConfidence}% Stock Conf.</td>
        <td style="font-weight: 700;">₹${order.orderValue}</td>
        <td><span class="badge ${riskBadgeClass}">${order.riskLevel}</span></td>
        <td><span class="badge ${statusBadgeClass}">${order.status}</span></td>
      </tr>
    `;
  }).join('');

  // Table Row Click Handlers
  DOM.queueTableBody.querySelectorAll('tr[data-order-id]').forEach(row => {
    row.addEventListener('click', () => {
      const orderId = row.getAttribute('data-order-id');
      AppState.selectedOrderId = orderId;
      AppState.currentRecommendation = null; // Reset recommendation state for new selection
      renderQueueTable();
      renderOrderWorkbench();
    });
  });
}

// Render Order Detail Workbench
function renderOrderWorkbench() {
  if (!DOM.wbOrderId) return;
  const order = AppState.orders.find(o => o.id === AppState.selectedOrderId);
  if (!order) return;

  const riskData = NOVAEngine.calculateRiskScore(order);

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
  DOM.wbRiskScore.textContent = `${riskData.score}/100`;

  DOM.wbFailureDesc.textContent = order.failureDescription;

  // Render Basket Items Table
  DOM.wbItemsList.innerHTML = order.items.map(item => {
    const confColor = item.inventoryConfidence < 25 ? 'var(--rose)' : (item.inventoryConfidence < 50 ? 'var(--amber)' : 'var(--emerald)');
    const stockBadge = item.inStock 
      ? `<span class="badge badge-emerald">Verified Stock</span>` 
      : `<span class="badge badge-danger">Unconfirmed Stock</span>`;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color);">
        <div>
          <div style="font-weight: 600; color: var(--text-main);">${item.name} (x${item.qty})</div>
          <div style="font-size: 0.775rem; color: var(--text-sub);">Unit Price: ₹${item.unitPrice}</div>
        </div>
        <div style="text-align: right;">
          <div>${stockBadge}</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: ${confColor}; margin-top: 0.2rem;">
            ${item.inventoryConfidence}% Confidence
          </div>
        </div>
      </div>
    `;
  }).join('');

  // If order is already Rescued, disable Analyze or show Rescued Notice
  if (order.status === 'Rescued') {
    DOM.btnAnalyze.disabled = true;
    DOM.btnAnalyze.textContent = 'Order Already Rescued';
    
    DOM.recCardContainer.innerHTML = `
      <div class="alert-callout emerald" style="margin-top: 1rem;">
        <div><strong>Order ${order.id} is Rescued!</strong></div>
        <div style="margin-top: 0.2rem; font-size: 0.85rem;">Fulfillment decision executed cleanly. Dashboard metrics updated live.</div>
      </div>
    `;
  } else {
    DOM.btnAnalyze.disabled = false;
    DOM.btnAnalyze.textContent = '⚡ Analyze & Rescue Order';
    
    if (!AppState.currentRecommendation) {
      DOM.recCardContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); margin-top: 1rem;">
          Click <strong>"⚡ Analyze & Rescue Order"</strong> to run the deterministic decision engine and evaluate optimal recovery options.
        </div>
      `;
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
  const altDetailsHtml = rec.alternativeDetails ? `
    <div style="background: var(--bg-dark); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem; border: 1px solid var(--border-color);">
      <div style="font-size: 0.75rem; color: var(--text-sub); text-transform: uppercase; font-weight: 700; margin-bottom: 0.4rem;">Alternative Option Details</div>
      ${Object.entries(rec.alternativeDetails).map(([key, val]) => `
        <div style="display: flex; justify-content: space-between; font-size: 0.825rem; margin-bottom: 0.2rem;">
          <span style="color: var(--text-sub); text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1')}:</span>
          <span style="color: var(--text-main); font-weight: 600;">${val}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  DOM.recCardContainer.innerHTML = `
    <div class="recommendation-card">
      <div class="rec-header">
        <div>
          <span class="badge ${rec.badgeClass}">${rec.actionBadge}</span>
          <h3 class="rec-title" style="margin-top: 0.4rem;">${rec.actionTitle}</h3>
        </div>
      </div>

      <div class="rec-reason">
        <strong>Deterministic Logic Rationale:</strong><br>
        ${rec.reason}
      </div>

      ${altDetailsHtml}

      <div class="impact-grid">
        <div class="impact-box">
          <div class="impact-box-label">ETA Impact</div>
          <div class="impact-box-val">${rec.etaImpact}</div>
        </div>
        <div class="impact-box">
          <div class="impact-box-label">Customer Retention</div>
          <div class="impact-box-val">${rec.customerImpact}</div>
        </div>
        <div class="impact-box">
          <div class="impact-box-label">Business Value</div>
          <div class="impact-box-val">${rec.businessImpact}</div>
        </div>
      </div>

      <div style="margin-top: 1.25rem;">
        <button id="btn-apply-rescue" class="btn-action emerald" style="width: 100%;">
          ✓ Apply Rescue Action (${order.id})
        </button>
      </div>
    </div>
  `;

  // Attach listener to Apply Rescue button
  const btnApply = document.getElementById('btn-apply-rescue');
  if (btnApply) {
    btnApply.addEventListener('click', () => handleApplyRescue(order, rec));
  }
}

// Handle "Apply Rescue"
function handleApplyRescue(order, rec) {
  // 1. Update Order Status
  order.status = 'Rescued';

  // 2. Increment Session Metrics
  AppState.sessionRescuedCount += 1;
  AppState.sessionPreservedRevenue += order.orderValue;

  // 3. Add to Audit Feed
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  AppState.auditLog.unshift({
    id: order.id,
    actionTitle: rec.actionTitle,
    orderValue: order.orderValue,
    customerName: order.customer.name,
    timestamp
  });

  // 4. Show Toast Notification
  showToast(`Order ${order.id} Rescued! ₹${order.orderValue} order value preserved.`);

  // 5. Re-render UI
  AppState.currentRecommendation = null;
  renderAll();
}

// Render Business Impact Calculator (Interactive Scenario Math)
function renderImpactCalculator() {
  if (!DOM.sliderValDisplay) return;
  const ratePct = AppState.hypotheticalRescueRate;
  DOM.sliderValDisplay.textContent = `${ratePct}% Rescue Target`;

  // Case Facts
  const monthlyOrders = NOVACartData.metrics.monthlyOrders; // 38,500
  const cancelRate = NOVACartData.metrics.cancellationRate; // 11%
  const unavailShare = NOVACartData.metrics.unavailabilityCancellationShare; // 35%
  const aov = NOVACartData.metrics.averageOrderValue; // ₹486

  // Calculations
  const totalAvailabilityCancellations = Math.round(monthlyOrders * cancelRate * unavailShare); // ~1,482 orders/mo
  const rescuedOrdersMonthly = Math.round(totalAvailabilityCancellations * (ratePct / 100)); // at 30% = 445 orders/mo
  const monthlyValuePreserved = Math.round(rescuedOrdersMonthly * aov); // at 30% = ₹2,16,270 (~₹2.16 Lakh)
  const annualValuePreserved = monthlyValuePreserved * 12; // ~₹25.95 Lakh / yr

  if (DOM.calcRescuedOrders) DOM.calcRescuedOrders.textContent = `${rescuedOrdersMonthly.toLocaleString('en-IN')} Orders / Mo`;
  if (DOM.calcMonthlyRevenue) DOM.calcMonthlyRevenue.textContent = `₹${(monthlyValuePreserved / 100000).toFixed(2)} Lakh / Mo (₹${monthlyValuePreserved.toLocaleString('en-IN')})`;
  if (DOM.calcAnnualRevenue) DOM.calcAnnualRevenue.textContent = `₹${(annualValuePreserved / 100000).toFixed(2)} Lakh / Year`;
}

// Render Session Audit Feed
function renderAuditFeed() {
  if (!DOM.auditFeedList) return;

  if (AppState.auditLog.length === 0) {
    DOM.auditFeedList.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem; text-align: center;">
        No rescue actions applied yet in this session.
      </div>
    `;
    return;
  }

  DOM.auditFeedList.innerHTML = AppState.auditLog.map(item => `
    <div style="padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
      <div>
        <span style="font-weight: 700; color: var(--emerald);">${item.id}</span> — 
        <span style="color: var(--text-main); font-weight: 600;">${item.actionTitle}</span>
        <div style="font-size: 0.75rem; color: var(--text-sub);">${item.customerName}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: var(--emerald);">+₹${item.orderValue}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">${item.timestamp}</div>
      </div>
    </div>
  `).join('');
}

// Show Toast Notification
function showToast(message) {
  if (!DOM.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="color: var(--emerald); font-size: 1.1rem;">✓</span>
    <span>${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Initialization Hook
if (document.getElementById('queue-table-body')) {
  initApp();
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


