/**
 * NOVA RESCUE — lightweight Node QA suite (no extra dependencies).
 * Run: node tests/qa_test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math,
  JSON,
  Array,
  Object,
  Number,
  String,
  Boolean,
  parseInt,
  isNaN,
  Infinity
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
sandbox.global = sandbox;

function loadScript(relPath) {
  const filename = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(filename, 'utf8');
  vm.runInNewContext(code, sandbox, { filename });
}

loadScript('js/data.js');
loadScript('js/engine.js');
loadScript('js/app.js');

const { NOVACartData, NOVAEngine, NOVAApp } = sandbox;

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed += 1;
    failures.push({ name, error: err.message });
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message}`);
  }
}

function cloneOrders() {
  return JSON.parse(JSON.stringify(NOVACartData.orders));
}

function orderById(id) {
  return JSON.parse(JSON.stringify(NOVACartData.orders.find((o) => o.id === id)));
}

function resetState() {
  NOVAApp.resetDemoState();
}

console.log('NOVA RESCUE QA Tests');
console.log('====================\n');

const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const stylesSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

test('A11y. Tabs expose tab semantics and keyboard navigation', () => {
  assert(/<nav class="nav-tabs" role="tablist"/.test(indexSource));
  assertEqual((indexSource.match(/role="tab"/g) || []).length, 4);
  assertEqual((indexSource.match(/role="tabpanel"/g) || []).length, 4);
  assert(indexSource.includes('aria-selected="true" tabindex="0"'));
  assert(appSource.includes("event.key === 'ArrowLeft'"));
  assert(appSource.includes("event.key === 'ArrowRight'"));
  assert(appSource.includes("event.key === 'Home'"));
  assert(appSource.includes("event.key === 'End'"));
  assert(appSource.includes("btn.setAttribute('aria-selected', isActive ? 'true' : 'false')"));
});

test('A11y. Queue selection uses a native button and restores focus after rendering', () => {
  assert(appSource.includes("className: 'order-select-btn'"));
  assert(appSource.includes("'aria-pressed': isSelected ? 'true' : 'false'"));
  assert(appSource.includes(".find(button => button.dataset.orderId === orderId)"));
  assert(appSource.includes('if (selectionButton) selectionButton.focus();'));
  assert(appSource.includes("event.key === 'Enter'" ) === false, 'Selection should use native button keyboard behavior');
});

test('A11y. Rescue keeps focus and announces concise polite status', () => {
  assert(indexSource.includes('id="heading-order-workbench" tabindex="-1"'));
  assert(indexSource.includes('id="app-announcement" class="visually-hidden" role="status" aria-live="polite"'));
  assert(appSource.includes('if (DOM.workbenchHeading) DOM.workbenchHeading.focus();'));
  assert(appSource.includes('Recommendation for order ${order.id}'));
  assert(appSource.includes('Order ${order.id} rescued.'));
});

test('A11y. Queue, audit, toast, and recommendation live regions avoid duplication', () => {
  assert(indexSource.includes('id="queue-results-status" class="visually-hidden" role="status" aria-live="polite"'));
  assert(!/id="audit-feed-list"[^>]*aria-live/.test(indexSource));
  assert(!/id="rec-card-container"[^>]*aria-live/.test(indexSource));
  assert(!/id="toast-container"[^>]*aria-live/.test(indexSource));
  assert(!/className: 'toast', role: 'status'/.test(appSource));
  assert(appSource.includes('function announceQueueResults(filteredOrders)'));
  assert(appSource.includes('}, 300);'));
});

test('A11y. Impact summary is debounced and reduced motion is respected', () => {
  assert(indexSource.includes('id="impact-announcement" class="visually-hidden" role="status" aria-live="polite"'));
  assert(appSource.includes('if (announce && DOM.impactAnnouncement)'));
  assert(appSource.includes('}, 500);'));
  assert(stylesSource.includes('@media (prefers-reduced-motion: reduce)'));
  assert(stylesSource.includes('.pulse-dot {\n    animation: none !important;'));
});

test('A11y. Styled evidence and basket titles are headings', () => {
  assertEqual((indexSource.match(/<h3 class="evidence-title">/g) || []).length, 5);
  assert(indexSource.includes('<h3 style="font-weight: 700; font-size: 0.875rem; margin-bottom: 0.5rem; color: var(--text-sub);">'));
});

// 1. Decision engine
test('1. Decision engine returns a structured recommendation for every demo order', () => {
  NOVACartData.orders.forEach((order) => {
    const rec = NOVAEngine.analyzeOrder(order);
    assert(rec && rec.actionType && rec.actionTitle && rec.risk, `Missing recommendation for ${order.id}`);
    assert(typeof rec.reason === 'string' && rec.reason.length > 0, `Missing rationale for ${order.id}`);
    assert(typeof rec.actionButtonText === 'string' && rec.actionButtonText.length > 0, `Missing action button for ${order.id}`);
  });
});

test('1b. Decision engine action types are one of the four supported rescue actions', () => {
  const allowed = ['MANUAL_INTERVENTION', 'ITEM_SUBSTITUTE', 'STORE_SWITCH', 'ETA_ADJUSTMENT'];
  NOVACartData.orders.forEach((order) => {
    const rec = NOVAEngine.analyzeOrder(order);
    assert(allowed.indexOf(rec.actionType) !== -1, `${order.id} returned unknown action ${rec.actionType}`);
  });
});

// 2. Risk score calculation
test('2. Risk score for ORD-8821 is High (severe stock uncertainty + 3rd-order LTV hook)', () => {
  const risk = NOVAEngine.calculateRiskScore(orderById('ORD-8821'));
  assertEqual(risk.score, 65, `Unexpected score ${risk.score}`);
  assertEqual(risk.level, 'High');
  assert(risk.minConfidence === 18);
  assert(risk.factors.some((f) => f.indexOf('Severe Inventory') !== -1));
  assert(risk.factors.some((f) => f.indexOf('3rd Order') !== -1));
});

test('2b. Risk score is capped at 99 and uses High/Medium/Low bands', () => {
  const high = NOVAEngine.calculateRiskScore(orderById('ORD-8830'));
  assert(high.score <= 99);
  assertEqual(high.level, 'High');
  const low = NOVAEngine.calculateRiskScore(orderById('ORD-8839'));
  assert(low.level === 'Low' || low.level === 'Medium' || low.level === 'High');
  assert(typeof low.score === 'number');
});

test('2c. Every demo order has a valid calculated risk score and category', () => {
  NOVACartData.orders.forEach((order) => {
    const risk = NOVAEngine.calculateRiskScore(order);
    const expectedLevel = risk.score >= 65 ? 'High' : (risk.score >= 40 ? 'Medium' : 'Low');
    assert(Number.isInteger(risk.score) && risk.score >= 0 && risk.score <= 99, `Invalid risk score for ${order.id}`);
    assertEqual(risk.level, expectedLevel, `Invalid risk category for ${order.id}`);
    assert(!Object.prototype.hasOwnProperty.call(order, 'riskLevel'), `Static risk category remains on ${order.id}`);
  });
});

test('2d. Risk returned to the UI and recommendation comes from the engine calculation', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert(appSource.includes("getOrderRisk(order).level !== filterRisk"), 'Risk filtering is not wired to calculated risk');
  assert(appSource.includes('const riskData = getOrderRisk(order);'), 'Risk UI is not wired to the shared calculation');
  assert(!/order\.riskLevel/.test(appSource), 'UI still reads a static risk category');

  NOVACartData.orders.forEach((order) => {
    const calculatedRisk = NOVAEngine.calculateRiskScore(order);
    assertEqual(NOVAApp.getOrderRisk(order).level, calculatedRisk.level);
    assertEqual(NOVAEngine.analyzeOrder(order).risk.level, calculatedRisk.level);
  });
});

// 3. Nearby store rescue
test('3. Nearby store rescue: ORD-8821 is re-routed to a nearby partner store', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8821'));
  assertEqual(rec.actionType, 'STORE_SWITCH');
  assert(rec.alternativeDetails && rec.alternativeDetails.type === 'Nearby Partner Store');
  assert(rec.actionTitle.indexOf('Nearby Partner Store') !== -1);
  assert(rec.alternativeDetails.name.indexOf('FreshMart Indiranagar') !== -1);
});

test('3b. Nearby store rescue: ORD-8842 switches away from the low-confidence store', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8842'));
  assertEqual(rec.actionType, 'STORE_SWITCH');
});

// 4. Product substitution
test('4. Product substitution: ORD-8824 offers an in-stock egg substitute', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8824'));
  assertEqual(rec.actionType, 'ITEM_SUBSTITUTE');
  assert(rec.alternativeDetails.name.indexOf('Eggs') !== -1 || rec.alternativeDetails.name.indexOf('Eggoz') !== -1 || rec.reason.indexOf('Farm Fresh Eggs') !== -1);
});

test('4b. Product substitution: ORD-8836 offers an almond-milk substitute', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8836'));
  assertEqual(rec.actionType, 'ITEM_SUBSTITUTE');
  assert(rec.reason.indexOf('Raw Pressery Almond Milk') !== -1);
});

test('4c. Product substitution is not forced on ORD-8821 (store re-route takes priority path)', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8821'));
  assertEqual(rec.actionType, 'STORE_SWITCH');
});

test('4d. Rescue scenarios depend on order data, not order IDs', () => {
  const engineSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'engine.js'), 'utf8');
  assert(!/order\s*\.\s*id\s*={2,3}\s*['"]/.test(engineSource), 'Engine contains an order-ID-specific decision');

  ['ORD-8824', 'ORD-8836'].forEach((id) => {
    const order = orderById(id);
    order.id = 'TEST-ORDER';
    assertEqual(NOVAEngine.analyzeOrder(order).actionType, 'ITEM_SUBSTITUTE');
  });
});

test('4e. All demo orders retain their intended rescue scenarios', () => {
  const expectedActions = {
    'ORD-8821': 'STORE_SWITCH',
    'ORD-8824': 'ITEM_SUBSTITUTE',
    'ORD-8827': 'ETA_ADJUSTMENT',
    'ORD-8830': 'MANUAL_INTERVENTION',
    'ORD-8833': 'STORE_SWITCH',
    'ORD-8836': 'ITEM_SUBSTITUTE',
    'ORD-8839': 'ETA_ADJUSTMENT',
    'ORD-8842': 'STORE_SWITCH'
  };
  NOVACartData.orders.forEach((order) => {
    assertEqual(NOVAEngine.analyzeOrder(order).actionType, expectedActions[order.id], `Changed rescue scenario for ${order.id}`);
  });
});

// 5. ETA adjustment
test('5. ETA adjustment: ORD-8839 (in-stock delay) recommends proactive ETA alert', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8839'));
  assertEqual(rec.actionType, 'ETA_ADJUSTMENT');
  assert(rec.etaImpact.indexOf('+8') !== -1);
  assert(rec.alternativeDetails.loyaltyCredit.indexOf('₹25') !== -1);
});

test('5b. ETA adjustment: ORD-8827 dispatch delay falls through to ETA alert', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8827'));
  assertEqual(rec.actionType, 'ETA_ADJUSTMENT');
});

// 6. High-risk manual override
test('6. High-risk manual override: ORD-8830 multi-item OOS uses split fulfillment', () => {
  const rec = NOVAEngine.analyzeOrder(orderById('ORD-8830'));
  assertEqual(rec.actionType, 'MANUAL_INTERVENTION');
  assert(rec.alternativeDetails.type === 'Split Fulfillment Network');
  assert(rec.actionTitle.indexOf('Priority Support') !== -1);
});

// 7–10. Apply Rescue Action, status, counters, preserved revenue
test('7. Apply Rescue Action updates the selected order without mutating the source catalog', () => {
  resetState();
  const sourceStatus = NOVACartData.orders.find((o) => o.id === 'ORD-8821').status;
  const order = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8821');
  const rec = NOVAEngine.analyzeOrder(order);
  const applied = NOVAApp.applyRescueAction(order, rec);
  assert(applied === true);
  assertEqual(order.status, 'Rescued');
  assertEqual(sourceStatus, 'At Risk');
});

test('8. At Risk → Rescued status change is the only status transition on apply', () => {
  resetState();
  const order = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8821');
  assertEqual(order.status, 'At Risk');
  NOVAApp.applyRescueAction(order, NOVAEngine.analyzeOrder(order));
  assertEqual(order.status, 'Rescued');
  const second = NOVAApp.applyRescueAction(order, NOVAEngine.analyzeOrder(order));
  assert(second === false, 'Applying rescue twice should be rejected');
});

test('9. Rescued order counter increments once per successful rescue', () => {
  resetState();
  assertEqual(NOVAApp.AppState.sessionRescuedCount, 0);
  const a = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8821');
  const b = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8830');
  NOVAApp.applyRescueAction(a, NOVAEngine.analyzeOrder(a));
  NOVAApp.applyRescueAction(b, NOVAEngine.analyzeOrder(b));
  assertEqual(NOVAApp.AppState.sessionRescuedCount, 2);
  NOVAApp.applyRescueAction(a, NOVAEngine.analyzeOrder(a));
  assertEqual(NOVAApp.AppState.sessionRescuedCount, 2);
});

test('10. Preserved revenue calculation sums rescued order values', () => {
  resetState();
  const a = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8821');
  const b = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8830');
  NOVAApp.applyRescueAction(a, NOVAEngine.analyzeOrder(a));
  NOVAApp.applyRescueAction(b, NOVAEngine.analyzeOrder(b));
  assertEqual(NOVAApp.AppState.sessionPreservedRevenue, 200 + 1240);
});

test('10b. Audit log records rescued order id, action, customer, and value', () => {
  resetState();
  const order = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8821');
  const rec = NOVAEngine.analyzeOrder(order);
  NOVAApp.applyRescueAction(order, rec);
  assertEqual(NOVAApp.AppState.auditLog.length, 1);
  assertEqual(NOVAApp.AppState.auditLog[0].id, 'ORD-8821');
  assertEqual(NOVAApp.AppState.auditLog[0].orderValue, 200);
  assertEqual(NOVAApp.AppState.auditLog[0].customerName, 'Ananya Sharma');
  assertEqual(NOVAApp.AppState.auditLog[0].actionTitle, rec.actionTitle);
});

// 11–12. Business impact + slider math
test('11. Business impact: availability cancellations = 38,500 × 11% × 35% ≈ 1,482', () => {
  const scenario = NOVAApp.computeImpactScenario(30);
  assertEqual(scenario.totalAvailabilityCancellations, 1482);
});

test('11b. Business impact at 30% default: 445 rescued orders, ₹2,16,270 / month, ₹25.95 Lakh / year', () => {
  const scenario = NOVAApp.computeImpactScenario(30);
  assertEqual(scenario.rescuedOrdersMonthly, 445);
  assertEqual(scenario.monthlyValuePreserved, 216270);
  assertEqual(scenario.annualValuePreserved, 216270 * 12);
  assertEqual((scenario.monthlyValuePreserved / 100000).toFixed(2), '2.16');
  assertEqual((scenario.annualValuePreserved / 100000).toFixed(2), '25.95');
});

test('12. Rescue-rate slider calculations scale linearly with the target percent', () => {
  const at30 = NOVAApp.computeImpactScenario(30);
  const at60 = NOVAApp.computeImpactScenario(60);
  const at5 = NOVAApp.computeImpactScenario(5);
  const at90 = NOVAApp.computeImpactScenario(90);
  assertEqual(at60.rescuedOrdersMonthly, Math.round(1482 * 0.6));
  assertEqual(at5.rescuedOrdersMonthly, Math.round(1482 * 0.05));
  assertEqual(at90.rescuedOrdersMonthly, Math.round(1482 * 0.9));
  assert(at60.monthlyValuePreserved > at30.monthlyValuePreserved);
  assert(at5.monthlyValuePreserved < at30.monthlyValuePreserved);
});

// 13. Search
test('13. Search matches Order ID', () => {
  const results = NOVAApp.filterOrders(cloneOrders(), '8821', 'ALL', 'ALL');
  assertEqual(results.length, 1);
  assertEqual(results[0].id, 'ORD-8821');
});

test('13b. Search matches customer name (case-insensitive)', () => {
  const results = NOVAApp.filterOrders(cloneOrders(), 'ananya', 'ALL', 'ALL');
  assertEqual(results.length, 1);
  assertEqual(results[0].customer.name, 'Ananya Sharma');
});

test('13c. Search matches store name', () => {
  const results = NOVAApp.filterOrders(cloneOrders(), 'koramangala', 'ALL', 'ALL');
  assert(results.length >= 1);
  assert(results.every((o) => o.store.name.toLowerCase().indexOf('koramangala') !== -1));
});

test('13d. Search with no match returns an empty list', () => {
  const results = NOVAApp.filterOrders(cloneOrders(), 'does-not-exist-xyz', 'ALL', 'ALL');
  assertEqual(results.length, 0);
});

// 14. Risk filtering
test('14. Risk filtering: High returns only High-risk queue rows', () => {
  const results = NOVAApp.filterOrders(cloneOrders(), '', 'High', 'ALL');
  assert(results.length > 0);
  assert(results.every((o) => NOVAApp.getOrderRisk(o).level === 'High'));
  const ids = results.map((o) => o.id);
  assert(ids.indexOf('ORD-8821') !== -1);
  assert(ids.indexOf('ORD-8830') !== -1);
});

test('14b. Risk filtering: Medium and Low are mutually exclusive', () => {
  const med = NOVAApp.filterOrders(cloneOrders(), '', 'Medium', 'ALL');
  const low = NOVAApp.filterOrders(cloneOrders(), '', 'Low', 'ALL');
  assert(med.every((o) => NOVAApp.getOrderRisk(o).level === 'Medium'));
  assert(low.every((o) => NOVAApp.getOrderRisk(o).level === 'Low'));
  const overlap = med.filter((m) => low.some((l) => l.id === m.id));
  assertEqual(overlap.length, 0);
});

test('14c. Risk filtering ignores stale labels and uses calculated categories', () => {
  const orders = cloneOrders();
  const order = orders.find((candidate) => candidate.id === 'ORD-8824');
  order.riskLevel = 'High';

  const lowRisk = NOVAApp.filterOrders(orders, '', 'Low', 'ALL');
  const highRisk = NOVAApp.filterOrders(orders, '', 'High', 'ALL');
  assert(lowRisk.some((candidate) => candidate.id === 'ORD-8824'));
  assert(!highRisk.some((candidate) => candidate.id === 'ORD-8824'));
});

// 15. Status filtering
test('15. Status filtering: At Risk returns all demo orders before rescue', () => {
  const results = NOVAApp.filterOrders(cloneOrders(), '', 'ALL', 'At Risk');
  assertEqual(results.length, NOVACartData.orders.length);
  assert(results.every((o) => o.status === 'At Risk'));
});

test('15b. Status filtering: Rescued is empty until apply, then includes rescued IDs', () => {
  resetState();
  const before = NOVAApp.filterOrders(NOVAApp.AppState.orders, '', 'ALL', 'Rescued');
  assertEqual(before.length, 0);
  const order = NOVAApp.AppState.orders.find((o) => o.id === 'ORD-8830');
  NOVAApp.applyRescueAction(order, NOVAEngine.analyzeOrder(order));
  const after = NOVAApp.filterOrders(NOVAApp.AppState.orders, '', 'ALL', 'Rescued');
  assertEqual(after.length, 1);
  assertEqual(after[0].id, 'ORD-8830');
  const remaining = NOVAApp.filterOrders(NOVAApp.AppState.orders, '', 'ALL', 'At Risk');
  assertEqual(remaining.length, NOVACartData.orders.length - 1);
});

test('15c. Combined search + risk + status filters compose correctly', () => {
  resetState();
  const results = NOVAApp.filterOrders(NOVAApp.AppState.orders, 'freshmart', 'High', 'At Risk');
  assert(results.every((o) => NOVAApp.getOrderRisk(o).level === 'High' && o.status === 'At Risk'));
  assert(results.every((o) => o.store.name.toLowerCase().indexOf('freshmart') !== -1 || o.id.toLowerCase().indexOf('freshmart') !== -1 || o.customer.name.toLowerCase().indexOf('freshmart') !== -1));
});

// 16. Add Test Order feature
test('16. Add Test Order control is present and the app exposes the creation flow', () => {
  assert(indexSource.includes('+ Add Test Order') || indexSource.includes('Add Test Order'));
  assert(appSource.includes('openAddOrderDialog'));
  assert(appSource.includes('createTestOrder'));
  assert(appSource.includes('addTestOrder'));
});

test('16b. Quick scenarios produce valid, realistic demo orders', () => {
  resetState();
  const nearby = NOVAApp.populateTestScenario('NEARBY_STORE_AVAILABLE');
  assert(nearby && nearby.customer && nearby.customer.name);
  assert(nearby.id.startsWith('TEST-'));
  assert(Array.isArray(nearby.items) && nearby.items.length > 0);
  assert(nearby.store && nearby.store.id);
  assert(typeof nearby.orderValue === 'number' && nearby.orderValue > 0);
  assertEqual(nearby.status, 'At Risk');
  assert(typeof nearby.failureDescription === 'string' && nearby.failureDescription.length > 0);
  const rec = NOVAEngine.analyzeOrder(nearby);
  assert(rec && rec.actionType);
});

test('16c. A generated test order can be added to the queue and selected', () => {
  resetState();
  const base = NOVAApp.populateTestScenario('SUBSTITUTE_AVAILABLE');
  const order = NOVAApp.createTestOrder(base);
  const before = NOVAApp.AppState.orders.length;
  const added = NOVAApp.addTestOrder(order);
  assertEqual(added, true);
  assertEqual(NOVAApp.AppState.orders.length, before + 1);
  const saved = NOVAApp.AppState.orders.find((candidate) => candidate.id === order.id);
  assert(saved && saved.status === 'At Risk');
  assertEqual(NOVAApp.AppState.selectedOrderId, order.id);
});

console.log('\n--------------------');
console.log(`Result: ${passed} PASS, ${failed} FAIL, ${passed + failed} total`);
if (failures.length) {
  console.log('\nFailed tests:');
  failures.forEach((item) => {
    console.log(` - ${item.name}: ${item.error}`);
  });
}

process.exit(failed ? 1 : 0);
