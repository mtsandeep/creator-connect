# System Messages

This project supports two kinds of “dashboard message” notifications:

- **System messages (code-defined)**: hardcoded in the frontend and shown based on product/app state.
- **Dashboard messages (Firestore-defined)**: created by admins in Firestore via the Admin UI.

Both message types share the same UI component and the same dismissal mechanism, so once a user closes a message it will not show again.

## Where messages are shown

Messages are rendered using:

- `src/components/DashboardMessageBar.tsx`

The message bar is currently mounted on:

- Influencer dashboard: `src/pages/influencer/Dashboard.tsx`
- Promoter dashboard: `src/pages/promoter/Dashboard.tsx`

## Dismissal ("don’t show again")

When a user dismisses a message, we store a dismissal record in Firestore:

- Path: `users/{uid}/dismissedDashboardMessages/{messageId}`
- Data:
  - `messageId`: string
  - `dismissedAt`: number (timestamp)

This is used by the hook to filter out dismissed messages.

## System messages (code-defined)

### Where they live

System messages are defined in:

- `src/hooks/useDashboardMessages.ts`

They are created in code (not stored in `dashboardMessages` collection).

### Example: influencer verified message

When `user.verificationBadges.influencerVerified === true`, the hook creates a message:

- `id`: `system.influencerVerified`
- `intent`: `success`
- `iconEmoji`: `✅`
- `title`: `You are now verified`
- `body`: `...`
- `ctaLabel` / `ctaPath`: optional action

Even though the content is in code, the dismissal is persisted in Firestore as:

- `users/{uid}/dismissedDashboardMessages/system.influencerVerified`

### Adding a new system message

1. **Choose a stable ID**

Use a prefix like:

- `system.<yourKey>`

Examples:

- `system.promoterWelcome`
- `system.influencerCompleteProfile`

2. **Define a condition**

Pick a condition based on state you already have in the client (usually `user`).

3. **Create the message object**

Match the `DashboardMessage` interface used by `DashboardMessageBar`:

- `id` (string)
- `intent` (`info | success | warning | promo`)
- `iconEmoji?` (string, optional)
- `title` (string)
- `body` (string)
- `ctaLabel?` (string)
- `ctaPath?` (string)
- `dismissible` (boolean)

4. **Include it in the final list**

In `useDashboardMessages.ts`, add it into the `setMessages([...])` composition.

Notes:

- If the message should be “show once”, keep it dismissible and rely on the dismissal doc.
- If it should be persistent, set `dismissible: false` (it will keep showing).

## Dashboard messages (Firestore-defined)

### Where they live

Admin-created messages are stored in Firestore:

- Collection: `dashboardMessages/{messageId}`

These messages are managed via the Admin UI:

- `src/pages/admin/DashboardMessages.tsx`

### Targeting (influencer / promoter / both)

`audienceRoles` controls targeting:

- `['influencer']` => influencers only
- `['promoter']` => promoters only
- `[]` or missing => both

### Scheduling

Optional fields:

- `startAt`: number (timestamp)
- `endAt`: number (timestamp)

If present, the hook will only show the message inside that window.

### Dismissal IDs for Firestore messages

Firestore messages are converted to an internal ID format:

- `dashboard.<firestoreDocId>`

So dismissal docs look like:

- `users/{uid}/dismissedDashboardMessages/dashboard.<firestoreDocId>`

## Security rules

Rules live in:

- `firebase.firestore.rules`

Relevant permissions:

- `dashboardMessages`:
  - read: authenticated users
  - write: admins (and blocked while impersonating)
- `users/{uid}/dismissedDashboardMessages`:
  - create/read: only the user
  - update/delete: disabled
