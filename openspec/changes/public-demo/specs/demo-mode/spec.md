# Demo Mode Specification

## Purpose

Defines the runtime behavior that enables anonymous public access to the demo instance, including middleware bypass, auto-authentication, and visual indicators.

## Requirements

### Requirement: Anonymous Access

The system SHALL allow unauthenticated users to access all application routes when `NEXT_PUBLIC_IS_DEMO=true`.

#### Scenario: Unauthenticated user accesses dashboard

- GIVEN `NEXT_PUBLIC_IS_DEMO=true` is set
- WHEN a user navigates to `/dashboard` without a session
- THEN the middleware does NOT redirect to `/login`
- AND the user sees the dashboard content

#### Scenario: Demo mode is off by default

- GIVEN `NEXT_PUBLIC_IS_DEMO` is not set or is `false`
- WHEN a user navigates to any protected route without a session
- THEN the middleware redirects to `/login`

### Requirement: Auto-Authentication

The system SHALL automatically create an ADMIN session for anonymous demo users.

#### Scenario: Demo user gets ADMIN role

- GIVEN `NEXT_PUBLIC_IS_DEMO=true` and no existing session
- WHEN a user accesses any protected route
- THEN the middleware auto-creates a session with role `ADMIN`
- AND the session is stored via Better Auth

#### Scenario: Session persists across navigation

- GIVEN a demo user has an auto-created session
- WHEN the user navigates between routes
- THEN the session remains active
- AND role checks pass for all ADMIN-only features

### Requirement: Demo Banner

The system SHALL display a persistent visual banner indicating demo mode.

#### Scenario: Banner is visible on all pages

- GIVEN `NEXT_PUBLIC_IS_DEMO=true`
- WHEN any page loads
- THEN a banner component is rendered at the top of the layout
- AND the banner displays text indicating this is a demo instance
- AND the banner does NOT obscure critical UI elements

#### Scenario: Banner dismisses for the session

- GIVEN the demo banner is visible
- WHEN the user clicks the dismiss button
- THEN the banner hides for the current browser session
- AND the banner reappears on the next session (page refresh)

### Requirement: Demo Data Reset Indicator

The system SHALL inform users that data resets nightly.

#### Scenario: Reset schedule is communicated

- GIVEN the demo instance is active
- WHEN a user views the demo
- THEN the banner or UI indicates data resets nightly
- AND no specific reset time is exposed to users

### Requirement: Write Operations in Demo Mode

The system SHALL allow full read/write operations in demo mode.

#### Scenario: Demo user can create records

- GIVEN a user is in demo mode with ADMIN role
- WHEN the user creates a socio, evento, or pago
- THEN the record is persisted to the database
- AND the user sees the success confirmation

#### Scenario: Demo user can edit and delete

- GIVEN a user is in demo mode with ADMIN role
- WHEN the user edits or deletes any record
- THEN the change is persisted
- AND revalidation triggers correctly

### Requirement: Demo Mode Detection

The system SHALL expose `IS_DEMO` to both server and client code.

#### Scenario: Server-side detection

- GIVEN `NEXT_PUBLIC_IS_DEMO=true`
- WHEN a Server Component or Server Action checks demo mode
- THEN `IS_DEMO` evaluates to `true`

#### Scenario: Client-side detection

- GIVEN `NEXT_PUBLIC_IS_DEMO=true`
- WHEN a Client Component checks `process.env.NEXT_PUBLIC_IS_DEMO`
- THEN the value is available and equals `"true"`

## Non-Requirements

- Write restrictions or read-only mode (demo allows full writes)
- User registration or login flows in demo mode (auto-login bypasses these)
- Data export or download restrictions
- Rate limiting specific to demo mode

## Dependencies

- Better Auth session creation (`lib/auth.ts`)
- Middleware configuration (`middleware.ts`)
- Layout component (`app/layout.tsx`) for banner rendering
- `NEXT_PUBLIC_IS_DEMO` environment variable from `demo-infrastructure`
