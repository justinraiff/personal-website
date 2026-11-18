// Spotify Authorization Code with PKCE + playlist importer + tier ranking.
const TIERS = ["S", "A", "B", "C", "D", "F"];
const CONFIG = window.SPOTIFY_CONFIG;
const TOKEN_KEY = "spotify-tier-list-session-v1";
const RANKING_PREFIX = "spotify-tier-list-rankings-v1:";
const songList = document.getElementById("song-list");
const searchInput = document.getElementById("song-search");
const undoButton = document.getElementById("undo-button");
const importButton = document.getElementById("import-button");
const playlistSelect = document.getElementById("playlist-select");
let songs = [];
let activePlaylistId = null;
let undoSnapshot = null;
let sortables = [];
let accessToken = null;
let refreshToken = null;
let tokenExpiresAt = 0;

function setNotice(message, isError = false) {
  const el = document.getElementById("notice");
  el.textContent = message;
  el.classList.toggle("error", isError);
}
function setConnection(connected, label) {
  document.getElementById("connection-label").textContent = label;
  document.getElementById("status-dot").classList.toggle("connected", connected);
  document.getElementById("connect-button").hidden = connected;
  document.getElementById("disconnect-button").hidden = !connected;
  document.getElementById("import-panel").hidden = !connected;
}
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function randomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join("");
}
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}
async function connectSpotify() {
  if (!CONFIG?.clientId || CONFIG.clientId === "YOUR_CLIENT_ID") {
    setNotice("Add your Spotify Client ID in js/config.js first.", true);
    return;
  }
  const verifier = randomString();
  const state = randomString(24);
  sessionStorage.setItem("spotify_pkce_verifier", verifier);
  sessionStorage.setItem("spotify_oauth_state", state);
  const challenge = await createCodeChallenge(verifier);
  const params = new URLSearchParams({
    client_id: CONFIG.clientId,
    response_type: "code",
    redirect_uri: CONFIG.redirectUri,
    scope: CONFIG.scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: challenge,
    state
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
async function exchangeCode(code, verifier) {
  const body = new URLSearchParams({
    client_id: CONFIG.clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: CONFIG.redirectUri,
    code_verifier: verifier
  });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Spotify sign-in failed.");
  storeTokens(data);
}
function storeTokens(data) {
  accessToken = data.access_token;
  if (data.refresh_token) refreshToken = data.refresh_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken, tokenExpiresAt }));
}
function restoreTokens() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY));
    if (!saved) return false;
    accessToken = saved.accessToken;
    refreshToken = saved.refreshToken;
    tokenExpiresAt = saved.tokenExpiresAt || 0;
    return Boolean(accessToken);
  } catch { return false; }
}
async function refreshAccessToken() {
  if (!refreshToken) throw new Error("Your Spotify session expired. Please reconnect.");
  const body = new URLSearchParams({ client_id: CONFIG.clientId, grant_type: "refresh_token", refresh_token: refreshToken });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Could not refresh Spotify session. Please reconnect.");
  storeTokens(data);
}
async function api(path) {
  if (!accessToken || Date.now() > tokenExpiresAt - 60000) await refreshAccessToken();
  let response;
  for (let attempt = 0; attempt < 4; attempt++) {
    response = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.status === 401 && refreshToken) {
      await refreshAccessToken();
      response = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    }
    if (response.status !== 429 || attempt === 3) break;
    const retryAfter = Number(response.headers.get("Retry-After")) || (attempt + 1) * 2;
    setNotice(`Spotify asked us to slow down. Retrying in ${retryAfter} seconds…`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }
  if (!response.ok) {
    let detail = `Spotify API error (${response.status}).`;
    try { const body = await response.json(); detail = body.error?.message || detail; } catch {}
    if (response.status === 429) detail = "Spotify is rate-limiting requests. Wait a moment and try again.";
    throw new Error(detail);
  }
  return response.json();
}
async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const code = params.get("code");
  if (error) {
    window.history.replaceState({}, document.title, CONFIG.redirectUri);
    throw new Error(`Spotify authorization was not completed: ${error}`);
  }
  if (!code) return false;
  const returnedState = params.get("state");
  const expectedState = sessionStorage.getItem("spotify_oauth_state");
  const verifier = sessionStorage.getItem("spotify_pkce_verifier");
  window.history.replaceState({}, document.title, CONFIG.redirectUri);
  sessionStorage.removeItem("spotify_oauth_state");
  sessionStorage.removeItem("spotify_pkce_verifier");
  if (!returnedState || returnedState !== expectedState || !verifier) throw new Error("Spotify sign-in could not be verified. Please connect again.");
  await exchangeCode(code, verifier);
  return true;
}
async function loadPlaylists() {
  setNotice("Connected. Loading your playlists…");
  const playlists = [];
  let offset = 0;
  while (true) {
    const page = await api(`/me/playlists?limit=50&offset=${offset}`);
    playlists.push(...(page.items || []).filter(item => item && item.id));
    if (!page.next) break;
    offset += page.items?.length || 50;
  }
  playlistSelect.innerHTML = "";
  if (!playlists.length) {
    playlistSelect.add(new Option("No playlists found", ""));
    importButton.disabled = true;
    setNotice("No playlists were returned for this Spotify account.", true);
    return;
  }
  playlists.forEach(playlist => {
    const label = `${playlist.name} · ${playlist.tracks?.total ?? "?"} tracks`;
    playlistSelect.add(new Option(label, playlist.id));
  });
  importButton.disabled = false;
  document.getElementById("import-help").textContent = `${playlists.length} playlists found. Select the one you want to rank.`;
  setNotice("Spotify connected. Choose your playlist and import it.");
}
function rankingStorageKey(playlistId) { return `${RANKING_PREFIX}${playlistId}`; }
function readSavedRankings(playlistId) {
  try { return JSON.parse(localStorage.getItem(rankingStorageKey(playlistId)) || "{}"); }
  catch { return {}; }
}
function saveSongs() {
  if (!activePlaylistId) return;
  // Persist only playlist-item indexes and the user's tier/ordering choices, not Spotify metadata.
  const rankings = {};
  songs.forEach((song, index) => { rankings[song.id] = { tier: song.tier, position: index }; });
  try { localStorage.setItem(rankingStorageKey(activePlaylistId), JSON.stringify(rankings)); }
  catch (error) { console.warn("Could not save rankings:", error); document.getElementById("list-footer").textContent = "Could not save in this browser. Check storage settings."; }
}
async function importPlaylist() {
  const playlistId = playlistSelect.value;
  if (!playlistId) return;
  importButton.disabled = true;
  document.getElementById("reshuffle-button").disabled = true;
  setNotice("Loading playlist details…");
  try {
    const playlistName = playlistSelect.selectedOptions[0]?.textContent?.split(" · ")[0] || "your playlist";
    const items = [];
    let offset = 0;
    let total = null;
    while (true) {
      const page = await api(`/playlists/${encodeURIComponent(playlistId)}/items?limit=50&offset=${offset}`);
      total = page.total ?? total;
      const batch = page.items || [];
      batch.forEach((entry, localIndex) => {
        const track = entry?.item || entry?.track;
        if (!track || track.type !== "track" || !track.id) return;
        const absoluteIndex = offset + localIndex;
        const artist = (track.artists || []).map(a => a.name).join(", ");
        const image = track.album?.images?.[0]?.url || "";
        items.push({
          id: `item-${absoluteIndex}`,
          spotifyId: track.id,
          uri: track.uri,
          title: track.name || "Unknown track",
          artist: artist || "Unknown artist",
          image,
          spotifyUrl: `https://open.spotify.com/track/${track.id}`,
          tier: "unranked"
        });
      });
      setNotice(`Importing ${playlistName}… ${Math.min(offset + batch.length, total ?? offset + batch.length)} of ${total ?? "…"} playlist items`);
      if (!page.next || !batch.length) break;
      offset += batch.length;
    }
    if (!items.length) throw new Error("No playable tracks were found in that playlist.");
    activePlaylistId = playlistId;
    const saved = readSavedRankings(playlistId);
    items.forEach(song => { if (saved[song.id]) song.tier = saved[song.id].tier || "unranked"; });
    // Keep ranked songs in their previous relative order; shuffle the unranked songs for a fresh queue.
    const ranked = items.filter(song => song.tier !== "unranked").sort((a, b) => (saved[a.id]?.position ?? 0) - (saved[b.id]?.position ?? 0));
    const unranked = shuffle(items.filter(song => song.tier === "unranked"));
    songs = [...unranked, ...ranked];
    undoSnapshot = null;
    render();
    document.getElementById("reshuffle-button").disabled = false;
    const skipped = (total ?? items.length) - items.length;
    setNotice(`Imported ${items.length.toLocaleString()} tracks from “${playlistName}”.${skipped > 0 ? ` ${skipped} unavailable or unsupported playlist items were skipped.` : ""} Your rankings save in this browser.`);
  } catch (error) {
    console.error(error);
    setNotice(error.message || "Could not import playlist.", true);
  } finally { importButton.disabled = false; }
}
function makeSongElement(song, compact = false, position = 0) {
  const row = document.createElement("article");
  row.className = `song-item ${compact ? "tier-song" : "song-row"}`;
  row.dataset.id = song.id;
  const art = document.createElement("div");
  art.className = "album-art";
  if (song.image) {
    const img = document.createElement("img"); img.src = song.image; img.alt = ""; img.loading = "lazy"; art.append(img);
  } else { art.textContent = "♪"; }
  const meta = document.createElement("div"); meta.className = "song-meta";
  const title = document.createElement("div"); title.className = "song-title";
  const trackLink = document.createElement("a"); trackLink.href = song.spotifyUrl; trackLink.target = "_blank"; trackLink.rel = "noopener noreferrer"; trackLink.textContent = song.title; trackLink.title = "Open this track on Spotify";
  title.append(trackLink);
  const artist = document.createElement("div"); artist.className = "song-artist"; artist.textContent = song.artist;
  meta.append(title, artist);
  row.append(art, meta);
  if (!compact) { const index = document.createElement("span"); index.className = "song-index"; index.textContent = `#${String(position).padStart(2, "0")}`; row.append(index); }
  row.title = `${song.title} — ${song.artist}`;
  return row;
}
function render() {
  songList.innerHTML = "";
  TIERS.forEach(tier => { document.getElementById(`tier-${tier}`).innerHTML = ""; });
  songs.filter(song => song.tier === "unranked").forEach(song => songList.append(makeSongElement(song)));
  TIERS.forEach(tier => songs.filter(song => song.tier === tier).forEach(song => document.getElementById(`tier-${tier}`).append(makeSongElement(song, true))));
  if (!songs.length) songList.innerHTML = '<div class="empty-state">Connect Spotify and import a playlist to get started.</div>';
  applySearch(); updateStats();
}
function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  [...songList.children].forEach(row => {
    const song = songs.find(item => item.id === row.dataset.id);
    if (song) row.hidden = Boolean(query) && !`${song.title} ${song.artist}`.toLowerCase().includes(query);
  });
}
function updateStats() {
  const ranked = songs.filter(song => song.tier !== "unranked").length;
  const remaining = songs.length - ranked;
  const percent = songs.length ? Math.round((ranked / songs.length) * 100) : 0;
  document.getElementById("loaded-count").textContent = songs.length.toLocaleString();
  document.getElementById("ranked-count").textContent = ranked.toLocaleString();
  document.getElementById("remaining-count").textContent = remaining.toLocaleString();
  document.getElementById("progress-label").textContent = `${percent}%`;
  document.getElementById("progress-fill").style.width = `${percent}%`;
  document.getElementById("unranked-badge").textContent = remaining.toLocaleString();
  TIERS.forEach(tier => { document.getElementById(`count-${tier}`).textContent = songs.filter(song => song.tier === tier).length.toLocaleString(); });
  undoButton.disabled = !undoSnapshot;
}
function snapshot() { return songs.map(song => ({ ...song })); }
function syncFromDOM() {
  const previous = undoSnapshot || snapshot();
  const newOrder = [];
  const containers = [{ element: songList, tier: "unranked" }, ...TIERS.map(tier => ({ element: document.getElementById(`tier-${tier}`), tier }))];
  containers.forEach(({ element, tier }) => {
    [...element.children].forEach((node, index) => {
      const song = songs.find(item => item.id === node.dataset.id);
      if (!song) return;
      song.tier = tier; song.position = index;
      node.classList.toggle("song-row", tier === "unranked");
      node.classList.toggle("tier-song", tier !== "unranked");
      newOrder.push(song);
    });
    element.classList.remove("sortable-drag-over");
  });
  if (newOrder.length !== songs.length) { songs = previous.map(song => ({ ...song })); undoSnapshot = null; render(); return; }
  songs = newOrder; undoSnapshot = previous; saveSongs(); applySearch(); updateStats();
}
function initializeSortables() {
  const containers = [songList, ...TIERS.map(tier => document.getElementById(`tier-${tier}`))];
  containers.forEach(container => new Sortable(container, {
    group: { name: "spotify-songs", pull: true, put: true }, animation: 0, draggable: ".song-item",
    ghostClass: "sortable-ghost", chosenClass: "sortable-chosen", fallbackOnBody: true, fallbackTolerance: 4, swapThreshold: 0.65,
    onStart: () => { undoSnapshot = snapshot(); updateStats(); },
    onMove: event => { containers.forEach(item => item.classList.remove("sortable-drag-over")); event.to.classList.add("sortable-drag-over"); },
    onEnd: () => { containers.forEach(item => item.classList.remove("sortable-drag-over")); syncFromDOM(); }
  }));
}
function disconnect() {
  accessToken = refreshToken = null; tokenExpiresAt = 0;
  sessionStorage.removeItem(TOKEN_KEY);
  setConnection(false, "Not connected");
  playlistSelect.innerHTML = '<option value="">Connect Spotify to load playlists</option>';
  importButton.disabled = true;
  setNotice("Disconnected from Spotify. Your saved rankings remain in this browser.");
}

document.getElementById("connect-button").addEventListener("click", connectSpotify);
document.getElementById("disconnect-button").addEventListener("click", disconnect);
importButton.addEventListener("click", importPlaylist);
undoButton.addEventListener("click", () => { if (!undoSnapshot) return; restoreSnapshot(undoSnapshot); undoSnapshot = null; saveSongs(); render(); });
document.getElementById("reshuffle-button").addEventListener("click", () => { const unranked = shuffle(songs.filter(song => song.tier === "unranked")); const ranked = songs.filter(song => song.tier !== "unranked"); songs = [...unranked, ...ranked]; saveSongs(); render(); });
searchInput.addEventListener("input", applySearch);
document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement !== searchInput) { event.preventDefault(); searchInput.focus(); }
  if (event.key === "Escape" && document.activeElement === searchInput) { searchInput.value = ""; applySearch(); searchInput.blur(); }
});

(async function init() {
  render(); initializeSortables();
  try {
    const completedOAuth = await handleOAuthCallback();
    const restored = completedOAuth || restoreTokens();
    if (restored) { setConnection(true, "Spotify connected"); await loadPlaylists(); }
  } catch (error) { console.error(error); setConnection(false, "Not connected"); setNotice(error.message, true); }
})();
