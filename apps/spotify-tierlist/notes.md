# Spotify Tier List — Project Notes

## Progress log

### Stage 1 — Interface prototype
- [x] Create initial project structure
- [x] Build dark, Spotify-inspired layout
- [x] Add tier board (S/A/B/C/D/F)
- [x] Add compact unranked song list
- [x] Shuffle sample songs on load
- [x] Add search and reshuffle controls

### Stage 2 — Drag-and-drop prototype
- [x] Add SortableJS to connect the seven song containers
- [x] Move songs between unranked and tiers
- [x] Reorder songs within tiers
- [x] Update tier counts and progress
- [x] Save rankings automatically in localStorage
- [x] Add one-step undo

## Ideas / future features
- Spotify OAuth using Authorization Code with PKCE
- Import a user-owned playlist
- Handle playlist pagination (about 28 pages for 1,400 tracks at 50 per page)
- Expand undo history beyond one action
- Export/import ranking backup
- Tier counts and ranking progress
- Filter songs by tier
- Duplicate playlist entries should remain separate entries

## Technical notes
- The app still uses sample data only; no Spotify connection yet.
- SortableJS is loaded from jsDelivr, so drag-and-drop needs an internet connection.
- Run locally by opening `index.html` in a modern browser.
- Rankings are stored in this browser using localStorage. Clearing site data can erase them.
- Spotify API access, data retention, and artwork usage must be checked against current Spotify developer terms before integration.
