# Semi Component Governance

This project standardizes all frontend UI on Semi Design components.

## Scope

All UI categories are in scope:

- Navigation: `Nav`, `Dropdown`, `Tabs`, `List`
- Data Entry: `Button`, `Input`, `TextArea`, `Select`, `Checkbox`, `Switch`, `Radio`, `Form`
- Data Display: `Card`, `Table`, `Tag`, `Typography`, `Empty`
- Feedback: `Modal`, `Banner`, `Toast`, `Spin`, `Tooltip`
- Layout: `Divider`, `ConfigProvider`, `LocaleProvider`

## Rules

- Prefer direct Semi components or thin wrappers around Semi.
- Do not override Semi visual defaults using ad-hoc utility classes on Semi components.
- Prefer Semi props first (`type`, `theme`, `size`, `icon`, `noHorizontalPadding`, `okButtonProps`, `cancelButtonProps`, etc.).
- Prefer theme tokens for brand/system colors; avoid one-off hardcoded spacing/radius/border overrides.
- Keep wrappers behavior-focused (typing, callback compatibility, keyboard handling), not appearance-focused.

## Disallowed Style Patterns On Semi Components

The following class patterns are disallowed on Semi component usages (except approved exceptions):

- Size/spacing: `w-*`, `h-*`, `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`
- Shape/border: `rounded-*`, `border-*`

## Exception Policy

Exceptions are allowed only when required by functionality, for example:

- Media preview requiring edge-to-edge body content.
- Virtualized viewport requiring strict container sizing.

Each exception must:

- Be localized to a specific component file.
- Include a short inline comment explaining why Semi props cannot satisfy the case.

## Baseline Matrix

Current baseline and migration priorities are tracked in the attached implementation plan and executed in phased batches:

- Foundation wrappers first
- Feedback/dialog standardization
- High-traffic task interaction surfaces
- Navigation/tabs/table unification
- Complex forms/dialogs
- Display/layout convergence
