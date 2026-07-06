# Project-Scoped Mobile Development Standards

This document establishes the production-quality guidelines and criteria for all mobile features implemented in this workspace.

---

## 1. Functional Requirements

* Implement every requested feature completely.
* Do not leave placeholders, TODOs, or unfinished screens.
* Ensure every button, form, API call, navigation flow, and interaction works correctly.
* Validate all user inputs.
* Handle loading, empty, success, and error states gracefully.
* Prevent crashes and unexpected behavior.
* Make sure every screen is responsive and smooth.

---

## 2. UI/UX Requirements

Create a modern, premium mobile experience.

### Design Principles
* Clean and minimal interface.
* Consistent spacing throughout the app.
* Rounded corners where appropriate.
* Modern typography.
* Excellent visual hierarchy.
* Premium animations and smooth transitions.
* High accessibility.

### Color System
* **Primary Buttons**: Must use a single consistent primary color across the application.
* **Secondary Buttons**: Must use a consistent secondary color.
* **Danger Actions**: Must use the same danger color.
* **Success/Warning Messages**: Must use consistent success and warning colors.
* **Disabled Components**: Clear and visually distinct disabled appearance.
* **Readability**: Ensure text colors maintain high readability at all times.

---

## 3. Cross-Platform Compatibility

The application must behave consistently on both **iOS** and **Android**.
* Native look and feel, using platform-specific interactions where appropriate.
* Safe Area support.
* Proper keyboard handling (e.g. KeyboardAvoidingView, dismissing keyboards).
* Correct status bar styling and gestures.
* Responsive layouts supporting multiple screen sizes (phones and tablets).

---

## 4. Reusable Components

Create and reuse components to avoid duplicated UI code:
* Buttons (ripple effects on Android, press feedback on iOS, accessible touch targets $\ge 44 \times 44$ points).
* Inputs (real-time validation, error messages, required indicators, keyboard-aware, auto-focus, visibility toggles).
* Cards, Modals, Bottom Sheets, Alerts, Loaders, Empty/Error States, Badges/Chips, Avatars, Search Bars.

---

## 5. Navigation

* Fast, predictable, and smooth transitions.
* Free of duplicate screens and memory-efficient.
* Deep-link ready and properly typed.

---

## 6. Performance

* Fast startup and 60 FPS scrolling where possible.
* Optimized image loading, lazy loading, and list view optimizations.
* Memoization (`useMemo`, `useCallback`) to minimize unnecessary re-renders.
* Code splitting where applicable.

---

## 7. Accessibility

* Support screen readers and dynamic font scaling.
* Maintain proper color contrast.
* Provide accessible labels and touch target sizes.

---

## 8. Error & Offline Experience

* Handle network failures, API errors, validation errors, permission denials, and timeouts.
* Cache data locally and display cached content.
* Display connection status and queue pending requests if necessary.

---

## 9. Security

* Secure token storage and secure API communication.
* Input sanitization and authentication verification.
* Never expose secrets, private keys, or API tokens.

---

## 10. Verification Checklist

Before considering any feature complete, verify:
* [ ] Fully implemented (no placeholders).
* [ ] Fully tested, responsive, and cross-platform compatible.
* [ ] Accessible with consistent colors and typography.
* [ ] Optimized performance with no console errors/crashes.
