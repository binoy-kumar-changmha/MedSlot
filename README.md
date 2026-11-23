# MedSlot — Clinic Appointment & Billing Manager

> **CSE 3206 — Software Engineering Sessional (22 Series) Project**  
> A clean, modular, full-stack clinic appointment scheduling and billing platform demonstrating SDLC requirements, three GoF design patterns across three categories, TDD with mocked external dependencies, Selenium E2E automation, GitHub Actions CI, Git configuration management, and self-directed **Swagger / OpenAPI 3.0** API documentation.

---

## Functional Modules (5 Modules)

| Module | Backend Service & Routes | Key Capabilities |
|---|---|---|
| **1. Auth** | `authService.js`, `/api/auth` | Staff registration, sign-in (`scrypt` salted hash + HMAC-SHA256 Bearer token), profile lookup, seeded demo account (`admin@medslot.local` / `admin123`). |
| **2. Patients** | `patientService.js`, `/api/patients` | Patient CRUD, search by name/phone, blood group & contact validation. |
| **3. Doctors** | `doctorService.js`, `/api/doctors` | Doctor directory, specialty filter, base consultation fee, shift availability toggle. |
| **4. Appointments** | `appointmentService.js`, `/api/appointments` | Visit creation via `AppointmentFactory` (`STANDARD`, `FOLLOW_UP`, `EMERGENCY`), doctor slot conflict detection, status transitions, outbound notice hook. |
| **5. Billing** | `billingService.js`, `/api/billing` | Invoice calculation via `FeeStrategy` + `FeeCalculator`, checkout settlement via `PaymentGatewayAdapter`, clinic KPI dashboard summary. |

---

## Design Patterns Used

| Category | Pattern | Location | Summary |
|---|---|---|---|
| **Creational** | **Factory Method** | `src/patterns/AppointmentFactory.js` | Instantiates `StandardAppointment`, `FollowUpAppointment`, or `EmergencyAppointment` with open-closed `registerCreator()`. |
| **Behavioral** | **Strategy** | `src/patterns/FeeStrategy.js` | Encapsulates `StandardFeeStrategy` (`1.0×`), `FollowUpFeeStrategy` (`0.5×`), and `EmergencyFeeStrategy` (`1.5× + ৳200`) with a 30% discount ceiling. |
| **Structural** | **Adapter** | `src/patterns/PaymentGatewayAdapter.js` | Translates internal `charge({ amount, invoiceId, method })` calls to `SimulatedBankSDK.processTransaction({ totalCents, externalRef, channel })`. |

---

## Self-Directed New Tool: Swagger / OpenAPI 3.0.3

- OpenAPI specification: [`src/config/openapi.yaml`](src/config/openapi.yaml)
- Interactive Swagger UI: **`http://localhost:4000/api-docs`**
- Raw OpenAPI JSON spec: **`http://localhost:4000/api-docs.json`**
- Automated spec contract verification: `npm run lint:openapi`

---

## Quick Start

```bash
# 1. Install backend and frontend dependencies
npm install
npm --prefix frontend install

# 2. Build the React + Tailwind frontend bundle into frontend/dist
npm run build

# 3. Start the full-stack server (serves UI + API + Swagger Docs on port 4000)
npm start
```

Open **`http://localhost:4000`** and click **"Fill Demo Account"** (`admin@medslot.local` / `admin123`).

---

## Testing & Coverage

```bash
# Run TDD unit tests (with mocked DB repositories, notification & payment gateway)
npm test

# Run unit tests with V8 coverage summary
npm run test:coverage

# Run headless Chrome Selenium WebDriver E2E test suite
npm run test:e2e
```

### Observed Vitest Coverage Summary (`npm run test:coverage`)
- **Test Suites**: 10 passed (37 tests passed)
- **Overall (`src/patterns/` + `src/services/`)**: **90.41% Statements**, **77.88% Branches**, **93.33% Functions**, **90.41% Lines**
  - `src/patterns/`: **91.35%** (`AppointmentFactory.js` 93.10%, `FeeStrategy.js` 91.17%, `PaymentGatewayAdapter.js` 88.88%)
  - `src/services/`: **89.85%** (`appointmentService.js` 86.48%, `authService.js` 89.28%, `billingService.js` 86.66%, `doctorService.js` 92.85%, `notificationService.js` 100%, `patientService.js` 95.65%)

---

## Git Branching & Commit Conventions

- **Branch naming**: `feature/<scope>`, `docs/<scope>`, `pr-demo/<scope>`
- **Commit style**: Conventional Commits (`feat(...)`, `test(...)`, `chore(...)`, `docs(...)`)
- **Merge strategy**: Explicit `--no-ff` feature merges preserving branch history, including a resolved merge conflict in `src/patterns/FeeStrategy.js` between `feature/fee-policy-update` and `feature/billing-discount`.
