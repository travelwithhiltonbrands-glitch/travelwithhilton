// 1) PASTE YOUR GOOGLE SHEET PUBLISHED CSV URL HERE
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1rzfXG0rT72yxstOE8V6DDC6NCdGpQGlZN6SV_eA5pT0/export?format=csv&gid=0";

const elQ = document.getElementById("q");
const elGrid = document.getElementById("grid");
const elStatus = document.getElementById("status");

const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mMeta = document.getElementById("mMeta");
const mBody = document.getElementById("mBody");
const mLinks = document.getElementById("mLinks");
document.getElementById("mClose").addEventListener("click", () => modal.close());

let rows = [];

// --- CSV parsing ---
function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = (cols[i] ?? "").trim());
    return obj;
  });
}

function splitCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// --- Helpers ---
function normalize(s) {
  return (s || "").toLowerCase();
}

function escapeHTML(s) {
  return (s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (m) return m[1];
  } catch {}
  return "";
}

function defaultThumb(row) {
  const yid = getYouTubeId(row.youtube_url);
  return yid ? `https://img.youtube.com/vi/${yid}/hqdefault.jpg` : "";
}

function haystack(r) {
  return [
    r.hotel_name,
    r.city,
    r.state_region,
    r.country,
    r.tags
  ].map(normalize).join(" ");
}

// --- Rendering ---
function render(list) {
  elGrid.innerHTML = "";

  if (!list.length) {
    elStatus.textContent = "No matches found.";
    return;
  }

  elStatus.textContent = `${list.length} video${list.length === 1 ? "" : "s"}`;

  for (const r of list) { 
    const hasVideo = !!getYouTubeId(r.youtube_url || "");
    const img = r.thumbnail_url || defaultThumb(r);
    const meta = [r.city, r.state_region, r.country].filter(Boolean).join(", ");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${hasVideo ? `<div class="playBadge">▶︎</div>` : ``}
      ${img ? `<img class="thumb" loading="lazy" src="${img}" alt="">` : `<div class="thumb"></div
