# Specification

## Summary
**Goal:** Make the “New Tab” draft experience match the “in Caffeine” draft experience in layout, styling, and behavior.

**Planned changes:**
- Identify and fix differences in theme/CSS/Tailwind application between the in-Caffeine view and the standalone new-tab view so both render the same colors, typography, spacing, and component styling.
- Align new-tab layout sizing/scrolling and overall page structure to prevent view-specific regressions (e.g., missing styles, different background, different layout behavior).
- Verify and preserve core interactions in the new-tab view (edit/runtime toggle, adding controls modal, inspector panel, recent signals panel, import/export panel) so they behave the same as in-Caffeine.

**User-visible outcome:** Opening the app in a new browser tab shows the same UI theme, layout, and interactions as when viewed inside Caffeine.
