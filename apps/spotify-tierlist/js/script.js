// Stage 1: interface prototype with sample data.
// Spotify import, drag-and-drop ranking, and persistent storage are later milestones.

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

const songList = document.getElementById("song-list");
const searchInput = document.getElementById("song-search");
let songs = shuffle([...sampleSongs]);

function shuffle(items) {
  // Fisher-Yates shuffle: unbiased in-place shuffle on a copied array.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function renderSongs(query = "") {
  const normalized = query.trim().toLowerCase();
  const visibleSongs = songs.filter(song =>
    `${song.title} ${song.artist}`.toLowerCase().includes(normalized)
  );

  songList.innerHTML = "";
  if (visibleSongs.length === 0) {
    songList.innerHTML = '<div class="empty-state">No songs match that search.</div>';
    return;
  }

  visibleSongs.forEach((song) => {
    const originalIndex = songs.indexOf(song) + 1;
    const row = document.createElement("article");
    row.className = "song-row";

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

    const index = document.createElement("span");
    index.className = "song-index";
    index.textContent = `#${String(originalIndex).padStart(2, "0")}`;

    row.append(art, meta, index);
    songList.append(row);
  });
}

document.getElementById("reshuffle-button").addEventListener("click", () => {
  songs = shuffle([...songs]);
  renderSongs(searchInput.value);
});

searchInput.addEventListener("input", () => renderSongs(searchInput.value));

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    renderSongs();
    searchInput.blur();
  }
});

renderSongs();
