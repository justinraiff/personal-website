# Spotify Tier List — Project Notes

## Progress log

### Stage 1 — Interface prototype
- [x] Build dark, Spotify-inspired layout and S/A/B/C/D/F board
- [x] Add compact unranked list, search, and shuffle

### Stage 2 — Drag-and-drop prototype
- [x] Add SortableJS across all seven song containers
- [x] Save rankings in localStorage and add one-step undo

### Stage 2.1 — Drag-and-drop reliability
- [x] Shared draggable selector and one-time Sortable initialization
- [x] Restore state if a drag produces an incomplete DOM read

### Stage 3 — Spotify connection
- [x] Add Authorization Code with PKCE (no client secret)
- [x] Request playlist-read-private only
- [x] Load the signed-in user's playlists
- [x] Import playlist items with 50-item pagination
- [x] Handle current `item` response shape and legacy `track` fallback
- [x] Keep duplicate playlist entries separate
- [x] Keep Spotify metadata in memory; persist only user tier choices and positions
- [x] Preserve per-playlist rankings in local browser storage
- [ ] Test OAuth and import against the user's Spotify account

## Ideas / future features
- Expand undo history beyond one action
- Export/import ranking backup
- Filter songs by tier
- Persist rankings to a file or optional cloud account
- Improve stability if the source playlist is reordered

## Technical notes
- Run locally with `py -m http.server 8000` and visit http://127.0.0.1:8000/.
- Spotify redirect URI must exactly match the URI registered in the developer dashboard.
- Spotify Client ID is public; never add a client secret to browser code.
- SortableJS is loaded from jsDelivr, so drag-and-drop needs an internet connection.
