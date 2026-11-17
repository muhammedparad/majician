# AMANAH Complete Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all dashboard interfaces across our website (Admin, Superadmin, User/Member, Volunteer, plus AppShell, Sidebar, headers, cards, metrics, and buttons) to replicate the exact aesthetic, fillings, component settings, typography, and effects/animations of the AMANAH Zakat platform reference, adhering to the space-filling rule while strictly preserving all existing content, workflows, and business logic.

**Architecture:** A comprehensive frontend design overhaul centered on modular CSS design tokens, modern typography pairing (*General Sans* / *Inter* + *Instrument Serif* italic accents + *Geist/JetBrains Mono* tags), floating glassmorphic headers, deep-emerald capsule sidebar with high-contrast active states, and responsive bento grid containers that fill available space harmoniously without empty gaps or awkward layout shifts.

**Tech Stack:** React 19, React Router 7, Vite 8, TypeScript, Vanilla CSS Modules / Global Design Tokens, Instrument Serif & General Sans Typography.

**Spec:** Redesign specification derived from `c:\Users\muham\OneDrive\Desktop\amanah-zakat\amanah-zakat` (AMANAH Zakat Management Platform export and verified section screenshots).

## Global Constraints

- **Content & Logic Invariance**: Retain 100% of existing application state, API endpoints, hooks, form inputs, button actions, routing, and data logic. No features or text deleted; only layout, styling, and visual structure enhanced.
- **Space-Filling Rule**: Ensure every screen and section fills its allocated space without sparse voids or awkward asymmetric white space. Bento cards stretch and align evenly with equal left and right content margins (`max-width: 1360px`, `padding: 0 20px 56px`).
- **Typography Standard**: Headline text pairs modern sans-serif with italic serif focal accents (`.serif` using *Instrument Serif*). Badges and metadata pills use uppercase tracked monospace (*Geist/JetBrains Mono*).
- **Color Palette & Fills**: Primary dark emerald green (`#0e5c48`, `#0b2a22`, `#0d4a3a`), fresh mint accents (`#8cc9b3`, `#e2f1ea`), clean white elevated cards (`#ffffff`), and subtle emerald-tinted borders (`rgba(14, 92, 72, 0.08)`).
- **Quality Gates**: Every task must pass `npm run typecheck`, `npm run build`, and `npm test`.

## Review Focus

1. **Role Responsiveness**: Verify that the Superadmin, Mahallu Admin, User/Member, and Volunteer dashboards render their respective role-specific layouts cleanly without missing cards or visual regression.
2. **Space-Filling Consistency**: Inspect that cards in grid containers (`.stat-grid`, `.am-dashgrid`, `.am-vtiles`, `.am-vgrid`) expand to fill rows evenly without orphan gaps.
3. **Interactive States**: Confirm that all buttons, sidebar links, action cards, and dropdowns have smooth hover/active transitions matching the AMANAH micro-animations.
4. **Mobile & Drawer Parity**: Ensure the mobile sliding drawer, header toggle, and bottom navigation remain fully functional with the new styling.
5. **No Broken Data Hooks**: Verify that all `useFetch`, `useApp`, and `useAuth` data display properly in the upgraded components.

---

### Task 1: Design Tokens, Typography & Base CSS Foundations

**Files:**
- Modify: `frontend/index.html` (add font links for General Sans and ensure Geist/JetBrains Mono & Instrument Serif)
- Modify: `frontend/src/app/app.css` (update global design tokens, typography, pills, badges, shadows, and animations)
- Modify: `frontend/src/app/app-extra.css` (augment helper utilities for bento cards, glass surfaces, and space filling)

**Steps:**
- [ ] Add General Sans and Geist Mono imports to `frontend/index.html`.
- [ ] Update `:root` and `.am` variables in `frontend/src/app/app.css` with the exact AMANAH emerald color tokens, borders, shadows, and radii.
- [ ] Add `.serif` styling for Instrument Serif italic accents and `.mono-tag` for uppercase tracked badges.
- [ ] Implement smooth micro-interactions (card hover lift, button transitions, glowing ring keyframes).
- [ ] Run `npm run typecheck` and `npm run build` to verify styling compiles cleanly.

### Task 2: Universal AppShell & Floating Glass Navigation

**Files:**
- Modify: `frontend/src/app/AppShell.tsx`
- Modify: `frontend/src/app/app-layout.css`

**Steps:**
- [ ] Update `dnav` header to match AMANAH's floating pill container (`backdrop-filter: blur(22px)`, rounded `20px` border radius, subtle border, shadow).
- [ ] Enhance brand logo with AMANAH-style emerald squircle monogram and clean tracked text.
- [ ] Restyle the notification bell button and user profile avatar menu with clean popover styling.
- [ ] Refine the subtle marquee track banner with smooth animation and elegant spacing.
- [ ] Apply the space-filling rule to `.am-grid` container: balanced margins, responsive column collapse, and equal gutters.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 3: Universal Sidebar Design & Navigation Groups

**Files:**
- Modify: `frontend/src/app/Sidebar.tsx`
- Modify: `frontend/src/app/app-sidebar.css`

**Steps:**
- [ ] Restyle `.am-sidebar` container as a sleek, deep-emerald curved capsule with refined subtle borders and gradient.
- [ ] Upgrade the user badge card inside the sidebar (avatar with status indicator, bold name, role pill, chevron).
- [ ] Redesign navigation item pills: high-contrast light-mint pill for active items (`.on`), soft hover highlights for inactive items.
- [ ] Refine group headers with clean uppercase mono/serif typography.
- [ ] Style the public ledger link pill and footer geometric mosque motif to blend seamlessly.
- [ ] Ensure mobile drawer inherits the exact capsule styling and transitions smoothly.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 4: Admin & Superadmin Dashboards (`Home.tsx`)

**Files:**
- Modify: `frontend/src/app/pages/Home.tsx`
- Modify: `frontend/src/app/app-pages.css`

**Steps:**
- [ ] Transform `.hero-panel` into an AMANAH emerald showcase banner featuring radial ambient glow, uppercase live badge pill, bold headline with `.serif` accent, and pill action buttons.
- [ ] Redesign `SuperStats` and `AdminStats` into balanced Bento grid stat cards with top mono label, prominent metric display, subtext pill, and space-filling width.
- [ ] Upgrade `MyUdhiyya` preview block (when displayed to admin/member) into clean bento cards with segmented payment bars and status badges.
- [ ] Ensure all existing links and actions (Mahallus, Members, Programs, Volunteers, Ledger) remain fully functional.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 5: Member Dashboard (`MemberDashboard.tsx`)

**Files:**
- Modify: `frontend/src/app/pages/MemberDashboard.tsx`
- Modify: `frontend/src/app/app-pages.css`
- Modify: `frontend/src/app/app-pages2.css`

**Steps:**
- [ ] Redesign Member hero banner with greeting, household reference, and quick action buttons.
- [ ] Upgrade the 4-item summary strip into a responsive bento grid (My Animal, Payment Progress with segmented bar, Status with live pulse pill, Next Date).
- [ ] Redesign the animal status card (`am-myanimal`) with premium photo card, animal code badge, and smooth AMANAH-style progress stepper.
- [ ] Style the banner notices, payment summary, and receipt download pill button.
- [ ] Apply space-filling rules to `.am-dashgrid` so cards fill left and right columns symmetrically.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 6: Volunteer Dashboard (`VolunteerDashboard.tsx`)

**Files:**
- Modify: `frontend/src/app/pages/VolunteerDashboard.tsx`
- Modify: `frontend/src/app/app-volunteer.css`

**Steps:**
- [ ] Redesign Volunteer hero header with `• VOLUNTEER` tag, greeting, and primary action pill buttons.
- [ ] Upgrade `.am-vtiles` into bento metric cards with soft mint icon squircles, bold figures, and space-filling grid columns.
- [ ] Redesign "Today's Tasks" list into interactive cards with left icon tile, task titles, status badges ("X pending"), and hover chevron animation.
- [ ] Redesign "Programme progress" card with multi-stage checkpoint stepper and glowing progress bar.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 7: Supporting Admin & Member Pages Polish

**Files:**
- Modify: `frontend/src/app/pages/Mahallus.tsx`
- Modify: `frontend/src/app/pages/Members.tsx`
- Modify: `frontend/src/app/pages/ManagePrograms.tsx`
- Modify: `frontend/src/app/pages/Tracking.tsx`
- Modify: `frontend/src/app/pages/Payments.tsx`

**Steps:**
- [ ] Apply AMANAH card styling, pill buttons, table headers, and status badges to admin management pages (Mahallus, Members, Programs).
- [ ] Ensure Tracking and Payments pages match the bento layout, segmented meters, and typography of the main dashboard.
- [ ] Confirm no space is left sparse or uneven across full-width views.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 8: Verification, Smoke Testing & Review

**Files:**
- Review: all modified CSS and TSX files
- Verification: Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

**Steps:**
- [ ] Execute `npm run typecheck` to confirm zero TypeScript compilation errors.
- [ ] Execute `npm test` to verify backend and unit tests remain green.
- [ ] Execute `npm run build` to ensure the production client bundle builds successfully.
- [ ] Verify responsive layout across desktop (1400px), tablet (1024px), and mobile (390px).
- [ ] Present completed redesign evidence and walkthrough to user.
