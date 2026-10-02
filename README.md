# NOVA RESCUE — Order Rescue & Local-Store Fulfillment Decision Engine

> **"Rescue the order before it becomes a cancellation."**

NOVA RESCUE is a lightweight, deterministic order rescue and local-store fulfillment decision engine designed for **NOVA CART** operations and support staff. It intercepts at-risk orders before cancellation occurs, turning inventory uncertainty into an actionable recovery decision.

---

## 🎯 Product Principle
> *The product is not merely an inventory dashboard. Its purpose is to prevent avoidable cancellations by turning inventory uncertainty into an actionable rescue decision.*

---

## 🚀 Key Features

### 1. Command Center Dashboard
- Real-time operations KPIs: **38,500 Monthly Orders**, **11% Cancellation Rate**, **~1,482 Availability Cancellations**, **5,900 Support Tickets/month**.
- Session Performance Bar tracking **Active At-Risk Queue**, **Rescued Order Counter**, **Preserved Order Value (₹)**, and **Customer Retention LTV Impact**.
- Live operations activity audit feed.

### 2. At-Risk Rescue Queue & Decision Engine Workbench
- Filterable queue of sample at-risk orders (Filter by **High/Medium/Low Risk** & **At Risk / Rescued Status**, search by ID, store, or customer).
- Order detail workbench displaying customer LTV risk (highlighting the **72% 3rd-order repeat probability hook**), store parameters, itemized stock confidence levels, and risk failure reasons.
- **"⚡ Analyze & Rescue Order"**: Executes the transparent, rules-based deterministic engine to generate actionable recovery recommendations.
- **Deterministic Action Types**:
  1. *Switch to Nearby Partner Store* (Re-routes order to alternative store within nearby radius with verified 95%+ inventory confidence).
  2. *Suggest Available Substitute Product* (In-stock product substitute with 1-tap WhatsApp approval link).
  3. *Accept ETA Adjustment & Push Alert* (Proactive customer update with loyalty cashback).
  4. *High-Risk Priority Support Override* (Split fulfillment & instant support callback).
- **"✓ Apply Rescue Action"**: Updates order status to **Rescued**, recalculates dashboard metrics live, updates badges, triggers toast notifications, and logs to audit feed.

### 3. Business Impact & Scenario Calculator
- Clearly distinguishes **Verified Case Facts** from **Scenario Estimates**.
- Interactive **Rescue Target Rate Slider** (5% - 90%, default 30%).
- Real-time math engine:
  - `38,500 orders × 11% cancellations × 35% availability issue = ~1,482 availability cancellations / month`
  - `At 30% Target Rescue Rate = ~445 orders rescued / month`
  - `At ₹486 AOV = ₹2.16 Lakh / month (₹25.95 Lakh / year) preserved order value`
- Explicit scenario disclaimer callouts.

### 4. Evidence Chain & Insights
- Maps NOVA CART metrics (35% unavailability cancellations, 29% phantom stock complaints, 39% store inventory burden, 5,900 support tickets, 72% 3rd order retention hook) directly to NOVA RESCUE capabilities.

---

## 🛠️ Technology Stack & Repository Constraints

- **Language & Standards**: Pure Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Zero External Dependencies**: No npm packages, heavy frameworks, databases, external APIs, or API keys required.
- **Ultra-Lightweight Footprint**: Total project footprint is **<150 KB** (well under the strict **10 MB limit**).
- **Deterministic & Transparent**: All decision logic is deterministic, rules-based, and fully transparent.

---

## 💻 How to Run Locally

Simply open `index.html` in any modern web browser:

```bash
# On Windows (PowerShell)
Start-Process index.html

# Or open directly via File Explorer in your browser of choice.
```

---

## 📁 File Structure

```
PromptWars/
├── index.html          # Main SPA interface (Command Center, Workbench, Impact, Evidence)
├── css/
│   └── styles.css      # Dark operations theme, responsive grid, status badges, animations
├── js/
│   ├── data.js         # NOVA CART metrics, partner stores, demo orders, substitute catalog
│   ├── engine.js       # Deterministic Decision Engine (risk scoring & recommendation generator)
│   └── app.js          # SPA application controller, state, event listeners, live math
├── tests/
│   ├── qa_test.js      # Dependency-free Node QA suite (PASS/FAIL)
│   └── README.md       # How to run tests
└── README.md           # Documentation
```

---

## Testing & QA

Lightweight, zero-dependency QA for the existing NOVA RESCUE engine, queue, rescue actions, and impact math. Tests load the same `js/data.js`, `js/engine.js`, and `js/app.js` files used by the browser app.

**Test command** (from the project root):

```bash
node tests/qa_test.js
```

**Result:** 29 tests, 29 PASS / 0 FAIL.

Coverage includes decision-engine action types, risk scoring, nearby-store re-route, product substitution, ETA adjustment, high-risk manual override, Apply Rescue (status change, rescued counter, preserved revenue, audit log), business-impact and rescue-rate slider math, search, risk filters, and status filters.

**Accessibility checks**
- Semantic landmarks (`header`, `nav`, `main`), heading hierarchy (`h1` → `h2` → `h3`), skip link, labeled search and rescue-rate slider.
- Keyboard access for tabs, filters, Analyze/Apply actions, queue rows (Enter/Space), and visible `:focus-visible` outlines.
- Table caption and `scope="col"` headers; `aria-live` on rescue toasts, recommendation output, and session KPIs; accessible risk/status labels.

**Security checks**
- Dynamic UI updates use `textContent` / DOM nodes instead of `innerHTML` string interpolation.
- No API keys, credentials, or external request construction from user input.
- Demo dataset phones remain masked; search/filter input is treated as text for matching only.
- Apply Rescue cannot re-apply an already-rescued order.
