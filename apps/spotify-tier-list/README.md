# My Spotify Tier List

A personal, browser-based tier list for songs in one of your Spotify playlists.

## Run locally

1. Install Python 3 if it is not already installed.
2. Open PowerShell in this folder (the folder containing `index.html`).
3. Run:

   ```powershell
   py -m http.server 8000
   ```

   If `py` is not recognized, try `python -m http.server 8000`.
4. Open **http://127.0.0.1:8000/** in your browser.
5. Click **Connect Spotify**, approve read-only playlist access, choose your playlist, and click **Import playlist**.

Keep the PowerShell window open while using the app. Stop the server with `Ctrl+C`.

## Spotify developer app settings

- Web API must be enabled.
- Add this exact Redirect URI: `http://127.0.0.1:8000/`
- The app requests only `playlist-read-private` when you sign in.
- `js/config.js` contains the public Spotify Client ID. A client secret is not used or needed; this app uses Authorization Code with PKCE.

If Spotify says the account is not allowed to use the app, check the app's User Management / allowlist in the Spotify Developer Dashboard and add the Spotify account you are signing in with.

## Data and privacy

- Playlist metadata and album artwork are fetched from Spotify when you import. They are not written to localStorage.
- Your tier assignments and item positions are saved in this browser's localStorage, separately for each playlist. Clearing browser site data removes those rankings.
- OAuth access and refresh tokens are kept in sessionStorage for the current browser tab session; disconnecting removes them.
- Songs are not changed in Spotify. The app only reads playlist data.
- Double-click a song row to open that track in Spotify.

## Notes

- Playlist items are fetched in pages of 50, so a playlist with around 1,400 items takes about 28 API requests.
- Unavailable items and non-track items are skipped.
- Repeated occurrences of a track are kept as separate playlist entries.
- Ranking IDs use each playlist item's position. If you substantially reorder the source playlist in Spotify, previously saved tier assignments may no longer line up with the same tracks.


## Deploy under your Cloudflare Pages website

1. Copy the contents of this `spotify-tier-list` folder into your GitHub repository at:
   `apps/spotify-tier-list/`
2. Commit and push the changes. Cloudflare Pages should deploy the updated site from the connected repository.
3. In the Spotify Developer Dashboard, open your app's settings and add this exact Redirect URI:

   `https://www.justinraiff.com/apps/spotify-tier-list/`

4. Save the Spotify app settings.
5. Open the deployed app at:

   `https://www.justinraiff.com/apps/spotify-tier-list/`

The redirect URI in `js/config.js` is already set to that exact address. The trailing slash is intentional; use it in the Spotify Dashboard too.

## Local testing

This hosted version is configured for the production URL. If you want to test it locally again, temporarily change `redirectUri` in `js/config.js` to `http://127.0.0.1:8000/` and add that exact URI in the Spotify Developer Dashboard as an additional redirect URI. You can then switch it back to the production URL before committing.
