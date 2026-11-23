# MedSlot — 5-Minute Live Demo & Viva Defense Guide

## 1. 5-Minute Live Demo Script

1. **Startup & Architecture Intro (45 sec)**:
   - Run `npm start` (or already running at `http://localhost:4000`).
   - Briefly state the 5 modules (`auth`, `patients`, `doctors`, `appointments`, `billing`) persisted in `data/medslot.db` (`node:sqlite`).
2. **Sign In & Dashboard Overview (45 sec)**:
   - On `http://localhost:4000`, click **"Fill Demo Account"** (`admin@medslot.local` / `admin123`) → **Sign In**.
   - Show the 4 live KPI cards (`Total Patients`, `Active Doctors`, `Scheduled Visits`, `Collected Revenue`) and Upcoming Scheduled Visits table.
3. **Patient + Factory Appointment + Conflict Check (90 sec)**:
   - Open **Patients** → search for a patient → click **Add Patient** and save a new patient.
   - Open **Appointments** → click **Book Appointment** → select `EMERGENCY` visit type (point out live `1.5× + ৳200` preview) and submit. Mention `AppointmentFactory` assigns `URGENT` priority & `30 min` duration, and blocks double-booking (`409`).
4. **Strategy Billing & Adapter Payment + Swagger UI (60 sec)**:
   - Open **Billing** → click **Generate Invoice** for the new appointment → point out computed total and `UNPAID` status → click **Pay Now** → status flips to `PAID` with `BANK-INV-...` reference from `PaymentGatewayAdapter`.
   - Click **API Docs (Swagger)** in the bottom-left sidebar (`/api-docs`) → expand `/api/appointments` or `/api/billing/invoices/{id}/pay` to show live OpenAPI 3.0.3 integration.
5. **Terminal Proof — Tests, Coverage & Git History (60 sec)**:
   - Show `npm run test:coverage` (`37/37` tests, `90.41%` overall coverage) and `npm run test:e2e` (`Selenium E2E clinicFlow passed`).
   - Run `git log --graph --oneline --all -n 18` to show feature branches, TDD Red→Green commits, and the resolved merge conflict commit.

---

## 2. Anticipated Viva Questions & Crisp Answers

- **Q1: Explain your 3 design patterns and why you rejected each alternative.**
  - *Factory Method (`AppointmentFactory.js`)*: Creates `Standard`, `FollowUp`, or `Emergency` appointments with distinct priority/duration and `registerCreator()` extensibility. Rejected *Abstract Factory* because we instantiate one product family (`BaseAppointment`), not correlated UI/storage suites.
  - *Strategy (`FeeStrategy.js`)*: Swaps pricing rules (`1.0×`, `0.5×`, `1.5× + 200`) inside `FeeCalculator` without `switch` conditionals. Rejected *Template Method* because inheritance locks discount composition.
  - *Adapter (`PaymentGatewayAdapter.js`)*: Adapts `SimulatedBankSDK.processTransaction({ totalCents, externalRef, channel })` to internal `charge({ amount, invoiceId, method })`. Rejected *Facade* because we are matching an incompatible external contract to an existing target interface, not hiding a multi-class subsystem.

- **Q2: How did you practice TDD and use mocks?**
  - In `feature/core-patterns`, we committed failing Vitest specs first (`0dcf01e`), then implemented the patterns (`78329cb`). Across `tests/unit/*Service.test.js`, all 5 SQLite repositories, `notificationService.sendAppointmentNotice`, and `paymentGateway.charge` are mocked with `vi.fn()` so business rules run in `< 500 ms` without touching disk or network.

- **Q3: Tell me about the Git merge conflict you resolved.**
  - `feature/fee-policy-update` added `policyNote` metadata to `EmergencyFeeStrategy.describe()` and a comment near `FeeCalculator.calculate()`, while `feature/billing-discount` branched from the same base and added `priorityBilling: true` plus `MAX_DISCOUNT_PERCENT = 30` in those exact lines of `src/patterns/FeeStrategy.js`. Merging both triggered a two-hunk conflict, which we resolved (`5e24546`) by preserving both policy metadata fields and the 30% discount cap, verified by `npm test`.

- **Q4: Why did you choose Swagger / OpenAPI 3.0 over Postman Collections?**
  - Postman collections live in client-side exports that drift from code; OpenAPI 3.0 lives in `src/config/openapi.yaml`, serves `/api-docs` directly from Express, models `bearerAuth` and error schemas cleanly, and is verified automatically in Vitest (`openapi.test.js`) and Selenium E2E.

- **Q5: What does your Selenium E2E test verify?**
  - `tests/e2e/clinicFlow.e2e.mjs` launches an isolated server + temporary SQLite DB, drives headless Chrome (`--headless=new`) through staff login, creating patient *Farhana Akter*, booking an `EMERGENCY` slot, generating & paying a `৳1,400` invoice, and verifying `/api-docs/` renders Swagger UI.
