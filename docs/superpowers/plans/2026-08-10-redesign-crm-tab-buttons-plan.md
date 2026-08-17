# CRM & Inventory Tab Buttons Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign tab navigation buttons (`.pill`) across `crm.html`, `kho-bai.html`, `ban-hang.html`, and modals using a Segmented Control & Pill Gradient design system in `css/common.css`.

**Architecture:** Create central `.tab-navigation-bar` container styles and enhanced `.pill` button states with HSL gradients, smooth micro-interactions, dark mode compatibility, and glowing active indicators in `css/common.css`. Update HTML wrappers across the application to consume the unified CSS class.

**Tech Stack:** HTML5, Vanilla CSS3 (Custom Properties & HSL Palettes), Bootstrap Icons.

## Global Constraints
- Custom colors and tokens MUST use CSS variables from `css/common.css` (`var(--primary)`, `var(--accent)`, `var(--bg-subtle)`, `var(--border-color)`, `var(--primary-glow)`).
- Preserve existing button IDs (`btn-tab-pipeline`, `btn-tab-directory`, `btn-tab-report`, `btn-tab-products`, `btn-tab-ledger`, etc.) and `onclick` event handlers.
- Ensure full responsiveness and dark mode compatibility (`[data-theme="dark"]`).

---

### Task 1: Implement Segmented Pill System in `css/common.css` and Cleanup `sales.css`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\css\common.css`
- Modify: `c:\Users\thaib\Máy tính\CRM\sales.css`

- [ ] **Step 1: Add `.tab-navigation-bar` and enhanced `.pill` styles to `css/common.css`**

Add the following CSS rule block to `css/common.css`:

```css
/* Segmented Control & Navigation Pill System */
.tab-navigation-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 5px;
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-full);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.pill i {
  font-size: 0.95rem;
  transition: transform 0.2s ease;
}

.pill:hover:not(.active) {
  background: var(--bg-surface);
  color: var(--text-main);
  border-color: var(--border-color);
  transform: translateY(-1px);
}

.pill.active {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #ffffff;
  font-weight: 700;
  border-color: transparent;
  box-shadow: 0 4px 14px var(--primary-glow);
  transform: translateY(-1px);
}

.pill.active i {
  color: #ffffff;
  transform: scale(1.1);
}
```

- [ ] **Step 2: Remove duplicate `.pill` rules from `sales.css`**

Remove lines 34-51 from `sales.css` so `.pill` is managed entirely by `css/common.css`.

- [ ] **Step 3: Verify CSS syntax**

Ensure no broken brackets or missing semicolons exist in `css/common.css` and `sales.css`.

---

### Task 2: Update HTML Wrappers in `crm.html`, `kho-bai.html`, and `ban-hang.html`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\crm.html`
- Modify: `c:\Users\thaib\Máy tính\CRM\kho-bai.html`
- Modify: `c:\Users\thaib\Máy tính\CRM\ban-hang.html`

- [ ] **Step 1: Update main view toggle sub-header in `crm.html`**

In `crm.html` around line 99, replace:
```html
<div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap:wrap;">
```
with:
```html
<div class="tab-navigation-bar">
```

- [ ] **Step 2: Update customer history modal sub-tabs in `crm.html`**

In `crm.html` around line 430, replace:
```html
<div style="margin-bottom: 16px; display: flex; gap: 8px; flex-wrap:wrap;">
```
with:
```html
<div class="tab-navigation-bar" style="margin-bottom: 16px;">
```

- [ ] **Step 3: Update inventory view tabs in `kho-bai.html`**

In `kho-bai.html` around line 126, replace:
```html
<div style="margin-bottom: 20px; display: flex; gap: 10px;">
```
with:
```html
<div class="tab-navigation-bar">
```

- [ ] **Step 4: Update category pills container in `ban-hang.html`**

In `ban-hang.html` around line 102, ensure `.category-pills` utilizes `.tab-navigation-bar` styling or wrapper.

---

### Task 3: End-to-End Verification & Walkthrough

- [ ] **Step 1: Verify all modified HTML files**
Check `crm.html`, `kho-bai.html`, `ban-hang.html`, `css/common.css`, and `sales.css` for structural correctness.

- [ ] **Step 2: Test tab interactions and visual rendering**
Ensure clicking tabs properly switches views and updates active classes without any layout breaks.
