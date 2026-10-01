---
name: Stage AI Labs Client Workspace
description: Precision in glass for accountable business operations.
colors:
  canvas: "rgb(var(--c-canvas))"
  panel: "rgb(var(--c-panel))"
  panel-2: "rgb(var(--c-panel-2))"
  ink: "rgb(var(--c-ink))"
  brand: "rgb(var(--c-brand))"
  brand-ink: "rgb(var(--c-brand-ink))"
  glass: "var(--stage-glass)"
  line: "var(--stage-line)"
  field: "var(--stage-field)"
  muted: "var(--stage-muted)"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 46px)"
    fontWeight: 550
    lineHeight: 1.14
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 550
rounded:
  field: "12px"
  selected: "14px"
  control: "20px"
  panel: "24px"
  navigation: "26px"
  large: "28px"
  access: "32px"
  pill: "999px"
spacing:
  tight: "12px"
  shell: "16px"
  row: "20px"
  panel: "24px"
  spacious: "28px"
  scene: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  navigation:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.navigation}"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.large}"
    padding: "28px"
---

# Design System: Stage AI Labs Client Workspace

## Overview

**Creative North Star: "Precision in glass"**

Stage is an operational B2B workspace, not a consumer chatbot. Dark access scenes establish the brand; a light, dark or system-controlled workspace gives owners and invited employees legible task-focused content. The implemented system pairs Manrope headings with DM Sans body text. The user-pinned Apple-inspired direction describes a functional CSS material approximation, not Apple's native glass API.

Glass separates navigation and selected controls from solid working surfaces. The interface communicates real account, channel, billing and agent states; material richness never implies a completed integration. Surface composition and dials remain in DESIGN-WORKSPACE.md.

**Key Characteristics:**

- Translucent navigation above opaque content.
- Restrained indigo signal, explicit operational state.
- Compact readable controls inside generous rounded containers.
- Theme-aware tokens and reduced-transparency alternatives.

## Colors

### Primary

Brand is restrained indigo: a deep signal in light mode and a pale signal in dark mode. Brand ink supplies the paired action foreground. These semantic tokens come from glass.css, which loads after index.css and overrides the older teal palette.

### Neutral

Canvas, panel and panel-2 establish page, content and raised layers. Ink and muted distinguish primary and secondary information. Field is a solid form background; line is the shared quiet boundary. Glass is reserved for navigation and access framing. Frontmatter references actual theme variables rather than freezing one theme as universal.

**The State Before Shine Rule.** Communicate current state in words and semantics; never use an accent or glass treatment as evidence of activation or connection.

## Typography

Display and task headings use Manrope; body, labels and controls use DM Sans. The principal workspace title has a fluid display scale, with tighter heading tracking. Empty-state titles are smaller and explanatory copy has generous leading. Settings headings reach 32px; access headings use a separate larger fluid range in glass.css. Do not generalize those surface-specific sizes to every heading.

Body controls commonly use 14px; field and secondary labels use 13px. Prices and settings use tabular numerals where alignment matters. Preserve the shipped type pairing.

**The Task Title Rule.** Name the current operation directly; do not precede headings with invented marketing eyebrows.

## Layout

The desktop shell has 16px padding and gap, a floating sidebar and a sticky 72px toolbar. Sidebar widths are 248px expanded and 76px collapsed. Main content is bounded at 1376px and padded 40px 24px 32px. Settings use local navigation and solid content.

At 1023px and below the sidebar gives way to mobile navigation, shell padding becomes 12px and content retains bottom-navigation clearance. Overview actions become a vertical list; settings navigation becomes static. At 600px and below agent builders become full-height, edge-to-edge dialogs. Access uses two desktop columns and a dedicated mobile scene plus email sheet.

## Elevation & Depth

Sidebar and toolbar use blurred saturated material, a fine border and inset highlight. Cards use tonal separation, not nested blur. The theme-aware stage-shadow supports floating navigation and dialogs; operational cards remain mostly flat. Access has deeper ambient framing above its image scene.

**The One Material Plane Rule.** Navigation refracts; content stays readable. Do not stack translucent text surfaces.

Reduced transparency replaces glass navigation with solid panel-2 and access framing with a solid dark surface. Reduced motion removes scoped workspace, access and builder transitions. Sidebar labels use a bounded 180ms opacity/translation change; sidebar positioning uses 260ms, not perpetual decoration.

## Shapes

Repeated field, selected-control, panel, navigation and large-container radii are recorded above. Pills mark actions and segmented selections. Access scenes use the larger access radius; the mobile builder intentionally loses its outer radius at full viewport height. Borders stay thin and subdued. Preserve logo assets and use existing Lucide product icons.

## Components

### Buttons

Primary actions use brand and paired brand ink, with pill-shaped builder actions and minimum 44px targets. Access submission is 52px. Secondary actions use quiet borders or ink-tinted fills. Disabled controls retain explicit semantics and waiting/unavailable states. Workspace focus uses a 2px brand outline with a 3px offset.

### Inputs / Fields

Workspace text fields use solid field backgrounds, thin ink-tinted borders, field radii and minimum 48px targets. Access inputs are 52px with slightly larger radii. Preserve visible labels, validation, required fields, password controls, providers and Turnstile.

### Navigation

Sidebar and settings navigation use real buttons with aria-current. Sidebar items have 48px targets and rounded selection fills. Collapsing hides labels while keeping named controls. Mobile bottom navigation is a separate floating region with safe-area clearance. Existing routes, destinations and analytics are not visual-design scope.

### Cards / Containers

Operational cards use solid panel backgrounds. Overview actions share divided rows instead of identical promotional cards. Agent builders separate material headers and footers from solid form content. Preserve pending billing and integration messages.

### Segmented controls

Access modes and agent tabs use pill rails with selected state exposed by existing semantics. The access indicator has a bounded spring and zero-duration reduced-motion branch. Selected appearance must match the actual selected mode.

## Do's and Don'ts

### Do:

- Do retain semantic light/dark/system tokens and solid reduced-transparency alternatives.
- Do keep navigation material distinct from readable operational content.
- Do preserve fields, providers, permissions, billing, legal and pending-integration states.
- Do verify focus, keyboard operation, responsive reflow and rendered readable contrast.

### Don't:

- Don't invent metrics, customer logos, certifications, backend connections or activation claims.
- Don't change the logo, existing navigation, routes or analytics without authorization.
- Don't add continuous decorative motion, neon purple meshes or stacked translucent text cards.
- Don't claim AA certification or measured Core Web Vitals from visual inspection alone.

