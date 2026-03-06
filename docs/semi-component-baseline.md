# Semi Component Baseline Matrix

This baseline is used to execute phased migration work.

## Wrapper Layer Inventory

### High impact wrappers

- `frontend/src/components/ui/dialog.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/select.tsx`
- `frontend/src/components/ui/dropdown-menu.tsx`
- `frontend/src/components/ui/alert.tsx`
- `frontend/src/components/ui/badge.tsx`

### Compatibility wrappers (lower style risk)

- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/textarea.tsx`
- `frontend/src/components/ui/switch.tsx`
- `frontend/src/components/ui/checkbox.tsx`
- `frontend/src/components/ui/tooltip.tsx`

## Component Category Coverage

### Navigation

- Direct: `SettingsLayout.tsx`, `McpSettings.tsx`
- Custom-heavy: `Navbar.tsx`, `ProjectSidebar.tsx`, `BranchSelector.tsx`, `RepoSelector.tsx`

### Data Entry

- Widely Semi-based in settings and dialogs
- Custom-heavy in: `TaskFormDialog.tsx`, `ExecutorConfigForm.tsx`, `components/rjsf/**`

### Data Display

- Mixed implementations in: `ui/table/table.tsx`, `ui/table/data-table.tsx`, `TagManager.tsx`

### Feedback

- Most concentrated style drift in dialog files under `components/dialogs/**`
- Highest risk: `PrCommentsDialog.tsx`, `ImagePreviewDialog.tsx`, `ReleaseNotesDialog.tsx`

### Layout

- Semi providers are centralized in `LegacyDesignScope.tsx`
- Tailwind + Semi layering is defined in `styles/legacy/index.css` and `styles/new/index.css`

## Risk Priorities

- P0: wrapper layer consistency and dialog spacing/border cleanup
- P1: high-traffic task navigation/select surfaces
- P2: table unification and display/layout convergence
