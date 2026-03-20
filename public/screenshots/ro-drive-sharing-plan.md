# RO Drive — Sharing & Organization Plan

## Share Links — Current State & Limits

- Each click of the share button creates a **new row** in `folder_shares` table in Supabase
- They expire after **30 days** but expired rows **never get deleted** — they just return "expired"
- Supabase free tier has no row limit, so thousands of shares won't cause issues, but it's sloppy
- Each share is a unique 48-char token URL like `rounlimited.com/shared/folder/a1b2c3...`
- **No cleanup exists** — need periodic cleanup of expired shares
- **Fix needed:** Stop creating a new share every click. Reuse existing active shares for same folder+permission, add cleanup.

## Drive Organization — Proposed Zones

```
RO Drive
├── Company Drive (shared across all admin users)
│   ├── Projects/
│   ├── Templates/
│   └── Documents/
├── My Drive (personal to each user)
│   ├── whatever-they-want/
│   └── ...
└── Shared with Me (folders/files others shared with this user)
    ├── Client A's uploads (from share link)
    └── Subcontractor docs (from share link)
```

- **Company Drive** — `folder` starts with `/company/`. All admin users see the same files. One shared pool.
- **My Drive** — `folder` starts with `/personal/`. Scoped to `user_email`. Private by default.
- **Shared with Me** — Not a real folder, just a view that aggregates shares where this user's email was granted access.

## Share Options Sheet (replacing auto-copy)

When you tap the share button, a bottom sheet with:
1. **View Only Link** — read-only, 30-day expiry (current behavior)
2. **Full Access Link** — readwrite, 30-day expiry
3. **Password Protected** — generates link that requires a password before showing files
4. **Share with User** — pick an RO admin user email, they see it in "Shared with Me"
5. **Expiration** — dropdown: 7 days / 30 days / 90 days / Never
6. **Manage Shares** — see all active shares for this folder, revoke any

## Benefits
- Clients upload to a shared folder, you see it in your Drive
- Internal team shares company-wide docs without duplicating
- Password-protected links for sensitive stuff (contracts, financials)
- User-to-user sharing for internal collaboration
- Clean separation so personal files don't mix with company files

## Implementation Phases

### Phase 1 (Quick Wins)
- Share options bottom sheet with view-only / full access / expiration picker
- Password-protected share links
- Reuse existing shares instead of creating duplicates
- Auto-cleanup of expired shares

### Phase 2 (Organization)
- Company Drive vs My Drive zones
- Share with specific users
- "Shared with Me" view
- Manage active shares screen
