---
name: skill-web
description: Improve web interfaces by reviewing UI, UX, accessibility, typography, colors, layouts, animations, and interface writing. Use this skill when building, reviewing, or refining websites and web applications.
---

# Skill: Better Web Interface

## Purpose

This skill helps AI agents improve the quality of websites and web applications by reviewing and refining every aspect of the user interface.

It combines best practices from design engineering, accessibility, UX writing, responsive layouts, color systems, typography, and interface polish.

Use this skill whenever you are:

- Building a new website
- Improving an existing UI
- Reviewing a landing page
- Designing dashboards
- Creating responsive layouts
- Improving accessibility
- Polishing animations and interactions
- Refining interface copy

---

# Included Reviews

## 1. Better Interface

Performs a complete UI/UX review covering every category below.

Focuses on:

- Overall usability
- Visual consistency
- User experience
- Interface hierarchy
- Product quality

---

## 2. Better UI

Improves visual polish.

Checks:

- Border radius
- Shadows
- Elevation
- Spacing
- Animations
- Hover effects
- Micro interactions
- Button states
- Card styling

---

## 3. Better Typography

Optimizes text readability.

Reviews:

- Font selection
- Font scale
- Line height
- Letter spacing
- Paragraph spacing
- Heading hierarchy
- Text wrapping
- Responsive typography

---

## 4. Better Colors

Uses modern color systems.

Includes:

- OKLCH palettes
- Accessible contrast
- Dark mode
- Light mode
- Theme consistency
- Semantic colors
- Status colors
- Brand colors

---

## 5. Better Accessibility

Ensures WCAG compliance.

Reviews:

- Keyboard navigation
- Focus indicators
- Screen reader support
- ARIA labels
- Form accessibility
- Color contrast
- Hit target size
- Motion preferences

---

## 6. Better Layout

Improves page structure.

Checks:

- Visual hierarchy
- Alignment
- Grid systems
- Responsive design
- Grouping
- White space
- Reading order
- Mobile layouts
- Breakpoints

---

## 7. Better Writing

Improves interface copy.

Reviews:

- Button labels
- Error messages
- Empty states
- Form hints
- Success messages
- Navigation labels
- Settings descriptions
- Confirmation dialogs

---

# Review Modes

## Quick

Fast review highlighting the most important improvements.

Example:

```
better-interface quick
```

---

## Full

Complete review with detailed explanations and recommendations.

Example:

```
better-interface full
```

---

## Feature Review

Review a specific screen, flow, or component.

Examples:

```
better-interface full checkout flow

better-interface full dashboard

better-interface full login page

better-interface full settings screen
```

---

# Example Commands

### Claude Code Plugin

```
/interfaces:better-interface

/interfaces:better-interface quick

/interfaces:better-interface full dashboard
```

---

### Claude Code (Skills CLI)

```
/better-interface

/better-interface quick

/better-interface full checkout flow
```

---

### Codex

```
$better-interface

$better-interface quick

$better-interface full dashboard
```

---

# Installation

## Install all skills

```bash
npx skills add jakubkrehel/skills --skill "*"
```

or

```bash
npx skills add jakubkrehel/skills
```

---

# Source

Repository:

https://github.com/jakubkrehel/skills

Website:

https://skills.sh/jakubkrehel/skills

Documentation:

https://interfaces.dev/

---

# Expected Output

The agent should provide:

- UI review
- UX review
- Accessibility review
- Typography improvements
- Color improvements
- Layout recommendations
- Writing improvements
- Prioritized issues
- Actionable suggestions
- Example implementations when applicable

The review should prioritize user experience, accessibility, responsiveness, maintainability, and modern web design best practices.