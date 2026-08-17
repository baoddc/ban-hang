# Redesign CRM & Inventory Tab Buttons (Segmented Pill Gradient Design)

## 1. Overview
Redesign and unify the tab navigation buttons (`.pill`) across the entire BAO ERP suite (`crm.html`, `kho-bai.html`, `ban-hang.html`, and modal dialogs). Replace unstyled/basic HTML buttons with a high-end **Segmented Control & Pill Gradient** system supporting dark mode, smooth micro-interactions, and responsive layout.

## 2. Core Aesthetic & Styling Specifications

### 2.1 Container Wrapper (`.tab-navigation-bar` / `.pill-group`)
- **Container Styling**: Elevated container panel with subtle background `var(--bg-subtle)` and border `1px solid var(--border-color)`.
- **Border Radius**: `var(--radius-lg)` (14px).
- **Layout**: `display: flex; gap: 6px; flex-wrap: wrap; align-items: center; padding: 5px;`.

### 2.2 Pill Buttons (`.pill`)
- **Base State**:
  - `display: inline-flex; align-items: center; gap: 8px;`
  - `padding: 8px 18px;`
  - `border-radius: var(--radius-full);` (9999px)
  - `background: transparent;`
  - `border: 1px solid transparent;`
  - `color: var(--text-muted);`
  - `font-size: 0.85rem; font-weight: 600;`
  - `cursor: pointer;`
  - `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
- **Hover State (`.pill:hover:not(.active)`)**:
  - `background: var(--bg-surface);`
  - `color: var(--text-main);`
  - `border-color: var(--border-color);`
  - `transform: translateY(-1px);`
- **Active State (`.pill.active`)**:
  - `background: linear-gradient(135deg, var(--primary), var(--accent));`
  - `color: #ffffff;`
  - `font-weight: 700;`
  - `box-shadow: 0 4px 14px var(--primary-glow);`
  - `transform: translateY(-1px);`
- **Icon Animation**:
  - `.pill.active i`: `transform: scale(1.1); color: #ffffff;`

## 3. Targeted Files & Modifications

1. **`css/common.css`**: Add central `.tab-navigation-bar`, `.pill`, `.pill:hover`, and `.pill.active` design system styles.
2. **`sales.css`**: Remove legacy redundant `.pill` definitions so `common.css` serves as the single source of truth.
3. **`crm.html`**:
   - Wrap main CRM view tabs (`#btn-tab-pipeline`, `#btn-tab-directory`, `#btn-tab-report`) in a `.tab-navigation-bar` container.
   - Wrap customer history modal sub-tabs in a `.tab-navigation-bar` container.
4. **`kho-bai.html`**:
   - Wrap inventory view tabs (`#btn-tab-products`, `#btn-tab-ledger`) in a `.tab-navigation-bar` container.
5. **`ban-hang.html`**:
   - Ensure category pills use the new segmented control wrapper `.tab-navigation-bar`.

## 4. Verification Plan
- Inspect visually using dev server / browser subagent across light and dark modes.
- Verify tab switching functionality remains intact for all pages (`switchCrmTab`, `switchInventoryTab`, `filterCategory`, `switchCustomerSubTab`).
