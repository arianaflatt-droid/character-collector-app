import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const RARITIES = ["Common", "Rare", "Epic", "Legendary"];
export const DEFAULT_WEIGHTS = { Common: 60, Rare: 25, Epic: 12, Legendary: 3 };
export const DEFAULT_XP_PER_PULL = 20;
export const DEFAULT_ROUND_XP = 120;      // one "round" = this much XP
export const DEFAULT_KEEPS = 3;           // how many pulls a student may keep per round

// settings = { xpPerPull, roundXp, keepsPerRound }
export function pullInfo(s, st) {
  const per = st.xpPerPull || DEFAULT_XP_PER_PULL;
  const ppr = Math.max(1, Math.floor((st.roundXp || DEFAULT_ROUND_XP) / per)); // pulls per round
  const fromXp = Math.max(0, Math.floor((s.totalXp || 0) / per) - (s.pullsUsed || 0)); // pulls earned with today's XP and not used yet
  const carry = Math.max(0, s.carry || 0);                                              // unused pulls kept from earlier days
  const bonus = Math.max(0, (s.bonusPulls || 0) - (s.bonusUsed || 0));                  // teacher-given pulls, kept automatically
  const earned = fromXp + carry;
  return { ppr, earned, fromXp, carry, bonus, total: earned + bonus };
}

// total pulls ready (earned + bonus); used by the teacher page
export function pullsAvailable(s, xpPer) {
  return pullInfo(s, { xpPerPull: xpPer, roundXp: DEFAULT_ROUND_XP }).total;
}

// Picks a rarity first (using weights, only among rarities that exist in the pool), then a random character of that rarity.
export function pickWeighted(pool, weights) {
  const present = RARITIES.filter(r => pool.some(c => c.rarity === r));
  if (!present.length) return pool[Math.floor(Math.random() * pool.length)];
  const w = r => Number(weights?.[r] ?? DEFAULT_WEIGHTS[r] ?? 1);
  const total = present.reduce((a, r) => a + w(r), 0);
  let x = Math.random() * total, chosen = present[present.length - 1];
  for (const r of present) { x -= w(r); if (x <= 0) { chosen = r; break; } }
  const sub = pool.filter(c => c.rarity === chosen);
  return sub[Math.floor(Math.random() * sub.length)];
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

// "Maya Lopez" -> "Maya", "Lopez, Maya" -> "Maya", "MAYA LOPEZ" -> "Maya"
export function firstName(full) {
  let s = String(full ?? "").trim();
  if (!s) return "";
  if (s.includes(",")) { const after = s.split(",").slice(1).join(" ").trim(); if (after) s = after; }
  const f = s.split(/\s+/)[0];
  return (f === f.toUpperCase() || f === f.toLowerCase()) ? f.charAt(0).toUpperCase() + f.slice(1).toLowerCase() : f;
}
