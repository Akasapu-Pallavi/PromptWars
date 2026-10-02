\# PROMPT JOURNEY — NOVA RESCUE



\## 1. Project Overview



\*\*Project:\*\* NOVA RESCUE — Order Rescue \& Local Store Fulfillment Decision Engine



\*\*Goal:\*\*

Build a lightweight decision-support application that helps operations teams prevent avoidable order cancellations caused by inventory uncertainty and local-store fulfillment issues.



\*\*Technology Used:\*\*



\* HTML5

\* CSS3

\* Vanilla JavaScript

\* Git \& GitHub

\* Google Antigravity

\* JSDOM for automated functional testing



The application was intentionally implemented without external APIs or heavy frameworks so that it remains lightweight, fast, portable, and well below the 10 MB repository limit.



\---



\## 2. Initial Prompting Strategy



The development process followed an iterative prompting approach rather than asking AI to generate the entire application blindly.



The main workflow was:



\*\*Problem Understanding → Architecture → Implementation → Testing → Debugging → Refinement → Git Submission\*\*



The AI was instructed to first understand the business problem and then convert the requirements into a functional operations workflow.



\---



\## 3. Problem Decomposition



The problem was divided into the following functional areas:



1\. Command Center

2\. At-Risk Order Queue

3\. Order Detail Workbench

4\. Rescue Decision Engine

5\. Business Impact Calculator

6\. Evidence \& Case Insights

7\. Audit / Rescue Activity Log



This decomposition helped transform the problem statement into individual UI and logic modules.



\---



\## 4. Architecture Prompt



The application was designed as a lightweight vanilla web application.



\### Architecture



```text

NOVA RESCUE

│

├── index.html

│

├── css/

│   └── styles.css

│

└── js/

&#x20;   ├── data.js

&#x20;   ├── engine.js

&#x20;   └── app.js

```



\### Responsibilities



\*\*index.html\*\*



\* Application structure

\* Dashboard sections

\* Order queue

\* Order inspector

\* Business impact section

\* Evidence section



\*\*styles.css\*\*



\* Operations dashboard styling

\* Risk badges

\* Responsive layout

\* Cards

\* Buttons

\* Status indicators



\*\*data.js\*\*



\* Demo orders

\* Customer information

\* Store information

\* Inventory information

\* Initial application state



\*\*engine.js\*\*



\* Rescue risk calculation

\* Failure-mode evaluation

\* Rescue recommendation generation

\* Business impact calculations



\*\*app.js\*\*



\* DOM interaction

\* Filtering

\* Search

\* Order selection

\* Rescue actions

\* Dashboard updates

\* Notifications

\* UI state management



\---



\## 5. Decision Engine Design



The core idea was to make NOVA RESCUE more than a static dashboard.



The application evaluates an order and produces an actionable rescue recommendation.



The decision engine considers:



\* Inventory confidence

\* Store distance

\* Customer value / LTV

\* ETA

\* Number of unavailable items

\* Fulfillment feasibility



The engine produces different recovery paths.



\### Recovery Scenarios



\#### Scenario 1 — Nearby Store Switch



Used when another nearby store has sufficiently reliable inventory.



\*\*Action:\*\*

Re-route fulfillment to the nearby store.



\---



\#### Scenario 2 — Product Substitution



Used when the requested product is unavailable but a suitable alternative exists.



\*\*Action:\*\*

Recommend a compatible substitute while considering price difference and product characteristics.



\---



\#### Scenario 3 — ETA Adjustment \& Proactive Alert



Used when inventory is sufficiently reliable but fulfillment may be delayed.



\*\*Action:\*\*

Adjust the ETA and proactively communicate with the customer.



\---



\#### Scenario 4 — Manual Override \& Split Fulfillment



Used for complex high-risk orders where one store cannot reliably fulfill the complete basket.



\*\*Action:\*\*

Escalate the order and recommend split fulfillment across suitable stores.



\---



\## 6. Risk Scoring



A deterministic risk score was introduced to prioritize operational attention.



The score considers multiple factors including:



\* Low inventory confidence

\* Fulfillment distance

\* Customer LTV risk

\* ETA impact

\* Multi-item availability problems



The resulting score is displayed on a 0–100 scale and categorized as:



\* High Risk

\* Medium Risk

\* Low Risk



This allows operations teams to focus on orders requiring the most immediate intervention.



\---



\## 7. Interactive Rescue Workflow



The primary user workflow is:



```text

At-Risk Order

&#x20;     ↓

Select Order

&#x20;     ↓

Inspect Inventory \& Customer Context

&#x20;     ↓

Analyze \& Rescue

&#x20;     ↓

Decision Engine

&#x20;     ↓

Recommended Rescue Action

&#x20;     ↓

Apply Rescue

&#x20;     ↓

Order → Rescued

&#x20;     ↓

Dashboard Metrics Updated

&#x20;     ↓

Audit Entry Created

```



The application therefore demonstrates an actual operational workflow rather than only displaying static information.



\---



\## 8. Business Impact Model



The application separates:



\### Verified Case Facts



Examples include:



\* Monthly orders

\* Baseline cancellation rate

\* Availability-related cancellation share

\* Average order value

\* Customer retention metric



\### Scenario Estimates



The user can configure a hypothetical rescue rate using the slider.



The application then calculates:



```text

Availability Risk Pool

×

Target Rescue Rate

=

Estimated Monthly Rescued Orders

```



Then:



```text

Estimated Monthly Rescued Orders

×

Average Order Value

=

Estimated Monthly Preserved Revenue

```



The application clearly labels these values as scenario estimates rather than guaranteed revenue.



\---



\## 9. Prompt Iteration



Development followed an iterative cycle.



\### Iteration 1 — Build



The AI was instructed to create the initial NOVA RESCUE prototype from the problem requirements.



\### Iteration 2 — Functional Logic



The AI was instructed to ensure that:



\* Orders could be selected

\* Risk could be calculated

\* Recommendations changed according to order conditions

\* Rescue actions changed application state



\### Iteration 3 — Interaction Testing



The application was tested for:



\* Search

\* Risk filters

\* Status filters

\* Order selection

\* Analyze button

\* Apply Rescue button

\* Business impact slider

\* Tab navigation



\### Iteration 4 — Debugging



Issues discovered during testing were fed back into the development process and corrected.



\### Iteration 5 — QA



An automated JSDOM test harness was used to verify the application's core functionality.



\---



\## 10. Quality Assurance



A complete functional QA pass was performed.



\### Result



\*\*15 / 15 checks passed\*\*



The tested areas included:



1\. Command Center loading

2\. Rescue Queue rendering

3\. Order selection

4\. Decision engine execution

5\. Recommendation variation

6\. Rescue status update

7\. Dashboard metric updates

8\. Business impact calculations

9\. Rescue-rate slider

10\. Risk categories and filtering

11\. Evidence section

12\. JavaScript error checking

13\. Button/interactivity verification

14\. Responsive layout

15\. Page refresh stability



\---



\## 11. Example Decision Outputs



Different orders produce different rescue decisions.



Examples include:



```text

ORD-8821

→ Store Re-route

```



```text

ORD-8824

→ Product Substitution

```



```text

ORD-8827

→ ETA Alert \& Voucher

```



```text

ORD-8830

→ Manual Override \& Split-Fulfillment

```



This demonstrates that NOVA RESCUE is not simply showing a predefined recommendation for every order.



\---



\## 12. Rescue Execution



When an operator selects:



\*\*Apply Rescue Action\*\*



the application:



1\. Changes the order status from `At Risk` to `Rescued`

2\. Updates the active at-risk queue

3\. Increments the session rescued-order count

4\. Updates preserved order value

5\. Adds the action to the activity/audit log

6\. Displays a confirmation notification



Example confirmation:



> Order ORD-8830 is Rescued!



This provides a complete action-feedback loop.



\---



\## 13. AI-Assisted Development Philosophy



The project used AI as an engineering collaborator rather than only as a code generator.



The prompting workflow emphasized:



\* Breaking the problem into modules

\* Making decisions deterministic

\* Testing generated functionality

\* Inspecting failures

\* Iteratively correcting implementation

\* Keeping the repository lightweight

\* Verifying the final workflow before submission



The objective was to use prompting to accelerate development while maintaining control over the application's architecture and behavior.



\---



\## 14. Repository Constraints



The final repository was kept intentionally lightweight.



Submission requirements considered during development:



\* Public GitHub repository

\* Single `main` branch

\* Repository size below 10 MB

\* Functional application

\* No unnecessary dependencies

\* Clean Git working tree



\---



\## 15. Final Development State



Final repository structure:



```text

PromptWars/

│

├── README.md

├── PROMPT\_JOURNEY.md

├── index.html

│

├── css/

│   └── styles.css

│

└── js/

&#x20;   ├── app.js

&#x20;   ├── data.js

&#x20;   └── engine.js

```



Git branch:



```text

main

```



The final implementation was committed and pushed to the public GitHub repository.



\---



\## 16. Key Takeaway



NOVA RESCUE was developed through a rapid AI-assisted engineering workflow:



```text

Understand

&#x20;  ↓

Decompose

&#x20;  ↓

Prompt

&#x20;  ↓

Build

&#x20;  ↓

Test

&#x20;  ↓

Debug

&#x20;  ↓

Refine

&#x20;  ↓

Validate

&#x20;  ↓

Submit

```



The central design principle was:



> \*\*Don't just predict that an order is at risk — turn the risk into an actionable rescue decision.\*\*



