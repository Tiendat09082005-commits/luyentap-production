---
name: TidaAdmin
description: Back-office admin panel for a Vietnamese e-commerce platform
colors:
  primary: "#3B82F6"
  primary-hover: "#2563EB"
  primary-light: "#EFF6FF"
  surface-page: "#F8F9FB"
  surface-card: "#FFFFFF"
  surface-elevated: "#F3F4F6"
  surface-sidebar: "#FFFFFF"
  border: "#E5E7EB"
  border-focus: "#3B82F6"
  text-primary: "#111827"
  text-secondary: "#6B7280"
  text-muted: "#9CA3AF"
  text-placeholder: "#D1D5DB"
  success: "#22C55E"
  success-muted: "#F0FDF4"
  danger: "#EF4444"
  danger-muted: "#FEF2F2"
  warning: "#F59E0B"
  warning-muted: "#FFFBEB"
typography:
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  page: "24px 28px"
  card: "16px 20px"
  cell: "12px 16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  table-header:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-muted}"
  card-surface:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
---

# Design System: TidaAdmin

## 1. Overview

**Creative North Star: "The Clean Desk"**

TidaAdmin is a workspace, not a showpiece. The visual system is built for admin staff managing an e-commerce catalog during business hours, in a well-lit office, on desktop screens. Every surface is light, every element earns its place, and nothing competes for attention that hasn't been asked for.

The system rejects decorative SaaS dashboards with gradient metric cards, glassmorphism panels, and animated counters. It equally rejects the dark-themed "developer tool" aesthetic that sacrifices readability for atmosphere. And it refuses Bootstrap's generic grey default that communicates nothing about the brand.

**Key Characteristics:**
- Light theme, warm-neutral palette tinted slightly toward slate
- Single accent color (blue) used only for primary actions and active states
- Flat surfaces with tonal layering, shadows only on hover/focus
- Consistent component vocabulary across every page
- Dense but readable data tables

## 2. Colors

A restrained palette. Tinted neutrals carry the interface; the single blue accent marks primary actions and selection state.

### Primary
- **Steady Blue** (#3B82F6): Primary actions, active navigation, focus rings, selected states. Used on no more than 10% of any screen.
- **Pressed Blue** (#2563EB): Hover/active state for primary buttons.
- **Blue Wash** (#EFF6FF): Subtle background tint for active sidebar items, selected rows.

### Neutral
- **Page Ground** (#F8F9FB): The base surface. Every page sits on this.
- **Card White** (#FFFFFF): Cards, table bodies, sidebar, modals.
- **Elevated Grey** (#F3F4F6): Table headers, hover rows, secondary surfaces.
- **Border Line** (#E5E7EB): All borders, dividers, table cell separators.
- **Ink** (#111827): Primary text, headings.
- **Secondary Ink** (#6B7280): Body text, descriptions, secondary labels.
- **Muted Ink** (#9CA3AF): Placeholders, disabled text, timestamps, column headers.

### Semantic
- **Success** (#22C55E) on **Success Wash** (#F0FDF4): Active status badges.
- **Danger** (#EF4444) on **Danger Wash** (#FEF2F2): Delete buttons, inactive status, error states.
- **Warning** (#F59E0B) on **Warning Wash** (#FFFBEB): Edit actions, caution indicators.

### Named Rules
**The One Accent Rule.** Blue is the only saturated color permitted for interactive elements. Semantic colors (green, red, amber) are reserved for status and state. No decorative gradients, no accent mixing.

## 3. Typography

**Body Font:** Inter (with system-ui, -apple-system fallback)
**Mono Font:** JetBrains Mono, Fira Code (for slugs, codes, technical values)

**Character:** Neutral, professional, disappears into the task. Inter's tabular figures make data tables scan cleanly.

### Hierarchy
- **Title** (700, 20px, 1.3): Page headings. One per page.
- **Subtitle** (600, 14px, 1.4): Card headers, section labels.
- **Body** (400, 13-14px, 1.5): Table cells, descriptions, form values.
- **Label** (600, 11px, 1.0, uppercase, tracking 0.05em): Table column headers, sidebar group labels, badge text.
- **Mono** (400, 12px): Slugs, attribute codes, IDs.

### Named Rules
**The No Display Rule.** No font size exceeds 22px anywhere in the admin. Page titles are 20px. Nothing screams.

## 4. Elevation

Flat by default. Surfaces are distinguished by background color (page ground vs card white vs elevated grey), not by shadows. Shadows appear only as responses to state.

### Shadow Vocabulary
- **Card rest** (`0 1px 3px rgba(0,0,0,0.06)`): Subtle, barely visible. Cards at rest.
- **Card hover** (`0 4px 12px rgba(0,0,0,0.08)`): Cards on hover, dropdowns.
- **Modal overlay** (`0 16px 40px rgba(0,0,0,0.16)`): Modals, dialogs.
- **Focus ring** (`0 0 0 3px rgba(59,130,246,0.25)`): All focusable elements.

### Named Rules
**The Flat Default Rule.** No element has a visible shadow at rest except modals. Shadows are earned by interaction.

## 5. Components

### Buttons
- **Shape:** Gently rounded (6px radius)
- **Primary:** Steady Blue background, white text, 8px 16px padding, 13px font, 600 weight
- **Hover:** Pressed Blue, translateY(-1px), subtle shadow
- **Focus:** 3px blue ring
- **Secondary:** Card White background, Border Line stroke, Secondary Ink text
- **Danger:** Danger red background, white text
- **Ghost:** Transparent, Secondary Ink text, hover shows Elevated Grey background

### Cards / Containers
- **Corner Style:** Comfortable rounding (12px)
- **Background:** Card White
- **Shadow Strategy:** Card rest shadow only (barely visible)
- **Border:** 1px Border Line
- **Internal Padding:** 16px 20px for headers, 0 for table content

### Inputs / Fields
- **Style:** Card White fill, 1px Border Line, 6px radius
- **Focus:** Border shifts to Steady Blue, 3px blue focus ring
- **Placeholder:** Muted Ink color

### Navigation (Sidebar)
- **Background:** Card White with right border
- **Items:** 13px, 500 weight, Secondary Ink color
- **Hover:** Elevated Grey background
- **Active:** Blue Wash background, Steady Blue text, 600 weight
- **Group labels:** Label style (11px, uppercase, Muted Ink)

### Data Tables
- **Header:** Elevated Grey background, Label typography, center-aligned
- **Cells:** 12-14px padding, center-aligned by default, Body typography
- **Rows:** 1px Border Line separator, Elevated Grey on hover
- **Last row:** No bottom border

### Status Badges
- **Active:** Success on Success Wash, 1px Success border at 30% opacity
- **Inactive:** Danger on Danger Wash, 1px Danger border at 30% opacity
- **Shape:** Pill (20px radius), 12px font, 600 weight

## 6. Do's and Don'ts

### Do:
- **Do** use the same button shape, padding, and typography on every page. If it looks different, it's wrong.
- **Do** use tonal layering (#F8F9FB page, #FFFFFF card, #F3F4F6 elevated) to create visual hierarchy without shadows.
- **Do** keep table headers uppercase, 11px, muted ink, and center-aligned everywhere.
- **Do** pair status colors with text labels (never color alone).
- **Do** use Inter or system fonts. No decorative fonts anywhere in the admin.

### Don't:
- **Don't** use dark backgrounds (#111318, #1a1d24, #151820, or any value below #F0F0F0) on any surface. This is a light-theme admin used in daylight.
- **Don't** use gradient backgrounds on buttons, cards, or toolbars. Flat solid colors only.
- **Don't** use glassmorphism, backdrop-filter blur, or semi-transparent overlays on content surfaces.
- **Don't** use animated counters, pulsing badges, or decorative motion. Motion is for state changes only.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe.
- **Don't** invent different button styles per page. One vocabulary, everywhere.
- **Don't** use `color: white` or `color: #e8eaf2` as the default text color. The base is Ink (#111827).
