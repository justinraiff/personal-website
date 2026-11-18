// Stage 2: sortable tiers, automatic local saving, and one-step undo.
// Spotify import will replace sampleSongs in a later stage.

const sampleSongs = [
  { title: "Midnight City", artist: "M83", color: "linear-gradient(135deg,#d45d6b,#372d67)", icon: "✦" },
  { title: "Dreams", artist: "Fleetwood Mac", color: "linear-gradient(135deg,#d9a15a,#6d3f37)", icon: "☼" },
  { title: "Nights", artist: "Frank Ocean", color: "linear-gradient(135deg,#587d9c,#27354b)", icon: "☾" },
  { title: "Somebody Else", artist: "The 1975", color: "linear-gradient(135deg,#a5a5a5,#454545)", icon: "✧" },
  { title: "Redbone", artist: "Childish Gambino", color: "linear-gradient(135deg,#c96d35,#632e24)", icon: "◉" },
  { title: "The Less I Know the Better", artist: "Tame Impala", color: "linear-gradient(135deg,#db8a45,#663c57)", icon: "◎" },
  { title: "Sweater Weather", artist: "The Neighbourhood", color: "linear-gradient(135deg,#71817a,#303c3b)", icon: "❄" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", color: "linear-gradient(135deg,#8d8d8d,#292929)", icon: "〰" },
  { title: "Pink + White", artist: "Frank Ocean", color: "linear-gradient(135deg,#e7a6b6,#7e718c)", icon: "✿" },
  { title: "Borderline", artist: "Tame Impala", color: "linear-gradient(135deg,#e6b05c,#b84b4b)", icon: "◇" },
  { title: "Ribs", artist: "Lorde", color: "linear-gradient(135deg,#7480b5,#34345b)", icon: "✧" },
  { title: "505", artist: "Arctic Monkeys", color: "linear-gradient(135deg,#b28b63,#45372e)", icon: "▧" }
];

const TIERS = ["S", "A", "B", "C", "D", "F"];
const STORAGE_KEY = "spotify-tier-list-stage2";
const songList = document.getElementById("song-list");
const searchInput = document.getElementById("song-search");
const undoButton = document.getElementById("undo-button");
let undoSnapshot = null;
let songs = loadSongs();
let sortables = [];

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function loadSongs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (error) {
    console.warn("Could not load saved rankings:", error);
  }
  return shuffle(sampleSongs.map((song, index) => ({ ...song, id: `demo-${index + 1}`, tier: "unranked" })));
}

function saveSongs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch (error) {
    console.warn("Could not save rankings:", error);
    document.getElementById("list-footer").textContent = "Could not save in this browser. Check storage settings.";
  }
}

function makeSongElement(song, compact = false) {
  const row = document.createElement("article");
  row.className = compact ? "tier-song" : "song-row";
  row.dataset.id = song.id;

  const art = document.createElement("div");
  art.className = "album-art";
  art.style.background = song.color;
  art.textContent = song.icon;

  const meta = document.createElement("div");
  meta.className = "song-meta";
  const title = document.createElement("div");
  title.className = "song-title";
  title.textContent = song.title;
  const artist = document.createElement("div");
  artist.className = "song-artist";
  artist.textContent = song.artist;
  meta.append(title, artist);

  row.append(art, meta);
  if (!compact) {
    const index = document.createElement("span");
    index.className = "song-index";
    index.textContent = `#${String(songs.indexOf(song) + 1).padStart(2, "0")}`;
    row.append(index);
  }
  return row;
}

function render() {
  songList.innerHTML = "";
  TIERS.forEach(tier => {
    document.getElementById(`tier-${tier}`).innerHTML = "";
  });

  songs.filter(song => song.tier === "unranked").forEach(song => {
    songList.append(makeSongElement(song));
  });
  TIERS.forEach(tier => {
    const container = document.getElementById(`tier-${tier}`);
    songs.filter(song => song.tier === tier).forEach(song => {
      container.append(makeSongElement(song, true));
    });
  });

  applySearch();
  updateStats();
  initializeSortables();
}

function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  [...songList.children].forEach(row => {
    const song = songs.find(item => item.id === row.dataset.id);
    row.hidden = Boolean(query) && !`${song.title} ${song.artist}`.toLowerCase().includes(query);
  });
}

function updateStats() {
  const ranked = songs.filter(song => song.tier !== "unranked").length;
  const remaining = songs.length - ranked;
  const percent = songs.length ? Math.round((ranked / songs.length) * 100) : 0;
  document.getElementById("loaded-count").textContent = songs.length;
  document.getElementById("ranked-count").textContent = ranked;
  document.getElementById("remaining-count").textContent = remaining;
  document.getElementById("progress-label").textContent = `${percent}%`;
  document.getElementById("progress-fill").style.width = `${percent}%`;
  document.getElementById("unranked-badge").textContent = remaining;
  TIERS.forEach(tier => {
    document.getElementById(`count-${tier}`).textContent = songs.filter(song => song.tier === tier).length;
  });
  undoButton.disabled = !undoSnapshot;
}

function snapshot() {
  return songs.map(song => ({ ...song }));
}

function syncFromDOM() {
  const previous = undoSnapshot || snapshot();
  const newOrder = [];
  const containers = [{ element: songList, tier: "unranked" }, ...TIERS.map(tier => ({ element: document.getElementById(`tier-${tier}`), tier }))];

  containers.forEach(({ element, tier }) => {
    [...element.children].forEach((node, index) => {
      const song = songs.find(item => item.id === node.dataset.id);
      if (song) {
        song.tier = tier;
        song.position = index;
        newOrder.push(song);
      }
    });
  });

  // Every song should be represented in exactly one of the seven containers.
  if (newOrder.length === songs.length) {
    songs = newOrder;
    undoSnapshot = previous;
    saveSongs();
    updateStats();
  }
  undoSnapshot = previous;
  updateStats();
}

function initializeSortables() {
  sortables.forEach(instance => instance.destroy());
  sortables = [];
  const containers = [songList, ...TIERS.map(tier => document.getElementById(`tier-${tier}`))];
  containers.forEach(container => {
    sortables.push(new Sortable(container, {
      group: { name: "spotify-songs", pull: true, put: true },
      animation: 150,
      draggable: container === songList ? ".song-row" : ".tier-song",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      fallbackOnBody: true,
      swapThreshold: 0.65,
      onStart: () => { undoSnapshot = snapshot(); updateStats(); },
      onEnd: () => syncFromDOM(),
      onMove: (event) => {
        event.to.classList.add("sortable-drag-over");
      }
    }));
    container.addEventListener("dragenter", () => container.classList.add("sortable-drag-over"));
    container.addEventListener("dragleave", () => container.classList.remove("sortable-drag-over"));
    container.addEventListener("drop", () => container.classList.remove("sortable-drag-over"));
  });
}

document.getElementById("reshuffle-button").addEventListener("click", () => {
  const unranked = shuffle(songs.filter(song => song.tier === "unranked"));
  const ranked = songs.filter(song => song.tier !== "unranked");
  songs = [...unranked, ...ranked];
  saveSongs();
  render();
});

undoButton.addEventListener("click", () => {
  if (!undoSnapshot) return;
  songs = undoSnapshot.map(song => ({ ...song }));
  undoSnapshot = null;
  saveSongs();
  render();
});

searchInput.addEventListener("input", applySearch);
document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    applySearch();
    searchInput.blur();
  }
});

render();
