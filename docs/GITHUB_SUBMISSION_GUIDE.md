# GitHub Push, Pull Request & CI Screenshot Submission Guide

Everything in this repository—feature branches, TDD commits, the resolved merge conflict in `src/patterns/FeeStrategy.js`, GitHub Actions CI (`.github/workflows/ci.yml`), and **two ready-to-open PR demo branches**—is already prepared locally. Follow these steps to publish to GitHub and capture the exact screenshots required by the manual.

---

## Step 1: Create a New GitHub Repository & Push All Branches

1. On GitHub, create a new empty repository (e.g., `medslot-clinic-manager`) **without** adding a README or `.gitignore`.
2. From the project root (`/Users/binoykumarchakma/Documents/6th Semester/CSE 3206/lab 6`), push `main` and all local branches:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/medslot-clinic-manager.git
git push -u origin main --all
```

3. Open the **Actions** tab on GitHub and confirm **MedSlot CI** (`test-and-e2e`) passes green on `main` (Vitest coverage + Vite build + headless Chrome Selenium E2E).

---

## Step 2: Open & Review the 2 Required Pull Requests

### PR #1 — Rejected / Revised PR (`pr-demo/rejected-fee-hardcode` → `main`)
1. On GitHub, open a Pull Request from **`pr-demo/rejected-fee-hardcode`** into **`main`**.
   - Title: `feat(billing): quick emergency surcharge override`
2. Go to **Files changed** and submit a review (**Request changes** or leave a review comment and **Close pull request** without merging):
   - *Suggested review comment*:
     > "Rejected: Hardcoding an extra surcharge inside `billingRoutes.js` bypasses `FeeStrategy` and breaks billing consistency with `FeeCalculator`. Please remove the route-level override and keep all pricing rules inside `src/patterns/FeeStrategy.js`."
3. Take a screenshot showing the PR review comment and the **Closed** / rejected status.

### PR #2 — Accepted & Merged PR (`pr-demo/accepted-health-metrics` → `main`)
1. On GitHub, open a Pull Request from **`pr-demo/accepted-health-metrics`** into **`main`**.
   - Title: `feat(api): add /api/health endpoint and OpenAPI specification`
2. Wait ~60 seconds for the **MedSlot CI** check on the PR to turn green (`All checks have passed`).
3. Add a review comment (**Approve**):
   - *Suggested review comment*:
     > "Clean healthcheck endpoint, updated OpenAPI 3.0 spec, and passing Vitest + CI checks. Approved to merge."
4. Click **Merge pull request** (Merge commit).
5. Take screenshots of:
   - The approved & **Merged** PR page
   - The green **Actions** CI run
   - The **Insights → Network** (or `git log --graph --oneline --all`) branch graph showing feature merges and the resolved conflict.
