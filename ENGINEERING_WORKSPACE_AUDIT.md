# ENGINEERING WORKSPACE AUDIT REPORT

## 1. Current Architecture Audit

The application is currently built as a single-page React application (SPA) running entirely client-side.
- **Framework:** React (via CDN, using Babel to transpile JSX on the fly in the browser).
- **Styling:** Tailwind CSS (via CDN).
- **State Management:** A monolithic `projectState` object stored in `localStorage` via a custom `usePersistentState` hook. State updates trigger re-renders across the entire `App` component.
- **Routing:** Handled manually via an `activeTab` state variable (e.g., 'input', 'loads', 'slab', 'beam', 'column', 'report'). There is no real router (like React Router).
- **Core Architecture:** The core logic is decoupled into vanilla JavaScript objects in the `js/core/engine` directory, which act as static methods. `app.jsx` acts as the Controller/View, pulling from the engine and mutating `projectState`.
- **Visualization:** 2D SVG diagrams are rendered using standard React SVG components. 3D visualization relies on `three.js` (via CDN) and `react-three-fiber` concepts, manually orchestrated.
- **Reporting:** A single `ReportViewer.jsx` component that consumes the `projectState` and maps out pre-calculated trace steps using KaTeX for formula rendering.

## 2. Existing Features Inventory

- **Tab 1 (Thông số Đầu vào):** Basic geometric inputs (Span, spacing, height, roof slope) and environmental inputs (Wind region, terrain).
- **Tab 2 (Tải trọng & Xà gồ mái):** Live calculation of Purlins and Cladding. Wind zone diagram (2D) and 3D building viewer.
- **Tab 3 (Nội lực Thiết kế):** Manual input table for load combinations (Mx, Vx, N) acting on the main frame.
- **Tab 4 (Thiết kế Sàn BTCT):** Slab design with span inputs, live load, concrete/rebar grades. Shows bending moment, required reinforcement, and detailed calculation trace.
- **Tab 5 (Thiết kế Dầm Thép):** Beam design (Bending, Shear, Deflection).
- **Tab 6 (Thiết kế Cột Thép):** Column checking (Combined Axial & Bending, Stability, Local Buckling) with section auto-suggestion based on input forces.
- **Tab 7 (Bảng tra Tiết diện):** A raw database viewer for section properties.
- **Tab 8 (Xuất Thuyết minh):** Printable A4 report aggregating all the calculation traces.

## 3. Existing Calculation Inventory

The calculations are scattered across module files in `/js/core/engine`:
1. **`wind_load.js`:** Calculates wind pressures based on TCVN 2737:2023. Computes `kz`, `ce`, `W3s_10`.
2. **`purlin_cladding.js`:** Checks roof cladding (deflection, strength) and purlins (biaxial bending, deflection) using TCVN 5575:2024. Implements automatic sag rod assumptions based on span.
3. **`slab_beam.js`:** Calculates RC slabs (TCVN 5574:2018) for bending reinforcement. Calculates Steel Beams (TCVN 5575:2024) for bending, shear, and deflection.
4. **`section_check.js`:** Evaluates steel columns for combined axial and bending stresses, global stability (in-plane and out-of-plane), and local buckling (flange/web c/t ratios).
5. **`section_proposal.js` / `loads_calc.js` / `load_combinations.js`:** Ancillary modules for auto-suggesting sections and calculating gravity loads / combinations.

## 4. Data Model Assessment

**Current Model:**
The `projectState` object is a massive, flat structure containing:
- `inputs`: Geometry, wind parameters, material selections.
- `meta`: Project name, author, dates.
- `forces`: An array of user-inputted forces for columns.
- `results`: The entire calculation output (traces, pass/fail booleans, governing cases).

**Issues:**
- **Lack of True Structural Model:** There is no concept of "Nodes" and "Members". The app assumes a generic "Frame" and calculates isolated parts (a slab, a beam, a purlin, a column).
- **Manual Force Transfer:** The user has to manually type in forces (M, V, N) for the column design. There is no structural analysis engine (e.g., Direct Stiffness Method) linking the wind loads to the column forces.
- **Monolithic State:** Any input change re-renders the entire app. Traces are stored as HTML/KaTeX strings inside the state, making the state extremely bloated and slow to serialize.

## 5. Missing Capabilities

To transform into a true "Engineering Workspace", the following are entirely missing:
1. **Structural Analysis Engine (FEA):** The app cannot calculate reactions, shear/moment diagrams, or frame displacements from applied loads.
2. **Data-Driven 3D Model:** The 3D viewer is currently a generic aesthetic box. It does not reflect actual individual members, nodes, or load applications.
3. **Load Combinations Generator:** Currently, load combinations are just manual input rows. The app needs an engine to generate ULS/SLS combinations dynamically (e.g., $1.2D + 1.6L + 0.5W$).
4. **AI Context Awareness:** The AI cannot currently "read" the results dynamically and explain them in a dedicated panel. The UI lacks a chat interface.
5. **Audit Logging & AI Safety:** There is no system tracking what the user changed vs. what the AI changed.
6. **Robust Connection Design:** The `connections.js` file exists but is barely integrated and lacks comprehensive checks (base plates, bolted moments, etc.).

## 6. Technical Debt

- **React CDN & Babel:** Running Babel in the browser on a massive `app.jsx` is extremely slow and prevents proper modularization (imports/exports). The code is packed into global window variables.
- **Global Scope Pollution:** StandardData and Engines are attached to the `window` object or rely on global scope.
- **Trace Rendering Coupling:** The calculation engines directly generate React/HTML steps. The engine should only return raw numerical data, and the UI should handle the formatting. This mixes presentation with business logic.
- **Regex Patching:** The codebase has been heavily patched via Regex scripts rather than standard Git workflows, leaving potential for fragile code boundaries.

## 7. Upgrade Roadmap (Phased Approach)

### Phase 1: Architectural Foundation & UI Transformation
- **Goal:** Move from "Calculator" to "Workspace" without breaking the math.
- **Tasks:**
  - Redesign the global layout: Sidebar navigation (Project -> Model -> Loads -> Design), central workspace, right-side AI Panel.
  - Implement a Dashboard (Status of Model, Loads, Combinations, Design).
  - Abstract `projectState` to handle `nodes` and `members` collections, even if currently limited to the default frame template.
  - Ensure all existing calculation engines are hooked into the new UI perfectly.

### Phase 2: Data Model & Analysis Layer
- **Goal:** Enable true load combinations and prepare for analysis.
- **Tasks:**
  - Build the Load Combination generator module.
  - Decouple the traces: Refactor engines to return structured JSON `(equation, parameters, result, status)`, and build a UI component to render the trace.
  - Upgrade the 3D Viewer to actually render `members` from the data model, coloring them by utilization.

### Phase 3: AI Copilot & Explanation Layer
- **Goal:** Make it an "Assistant".
- **Tasks:**
  - Build the AI Chat panel.
  - Implement the "Why does this fail?" context-injection function.
  - Implement the Audit Log for AI actions (Suggest Section -> Approve -> Apply).

### Phase 4: Finalizing the Workflow
- **Goal:** Polish and expand.
- **Tasks:**
  - Integrate comprehensive Connection Design.
  - Expand Section Library UI.
  - Finalize the unified Report generation pulling from the new trace architecture.
