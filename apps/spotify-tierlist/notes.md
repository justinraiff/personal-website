# Spotify Tier List — Project Notes

## Progress log

### Stage 1 — Interface prototype
- [x] Create initial project structure
- [x] Build dark, Spotify-inspired layout
- [x] Add tier board (S/A/B/C/D/F)
- [x] Add compact unranked song list
- [x] Shuffle sample songs on load
- [x] Add search and reshuffle controls
- [ ] Review layout and make design adjustments

## Ideas / future features
- Spotify OAuth using Authorization Code with PKCE
- Import a user-owned playlist
- Handle playlist pagination (about 28 pages for 1,400 tracks at 50 per page)
- Drag songs between unranked list and tiers
- Undo last move
- Persist ranking state locally
- Export/import ranking backup
- Tier counts and ranking progress
- Filter songs by tier
- Duplicate playlist entries should remain separate entries

## Technical notes
- Stage 1 uses sample data only; no Spotify connection yet.
- Run locally by opening `index.html` in a modern browser.
- `js/script.js` currently shuffles the sample data on page load.
- Spotify API access, data retention, and artwork usage must be checked against current Spotify developer terms before integration.
