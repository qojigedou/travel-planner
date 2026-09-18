// Each trip gets a stable, generated "sky" so the grid never looks like a wall of grey boxes.
const SKIES = [
  ["#f4a26b", "#d9573a", "#6b2c4a"], // sunset
  ["#7fd1c7", "#2c8c99", "#173f5f"], // lagoon
  ["#f2d3a0", "#d69a5b", "#7b4a2e"], // desert
  ["#a8c5f0", "#5a7fd1", "#2e3f7f"], // alpine morning
  ["#b9d99a", "#4f9a6a", "#1f4d40"], // forest
  ["#f5b5c0", "#b76a9e", "#453a7a"], // dusk
  ["#ffd37a", "#f08a4b", "#9c3b3b"], // harvest
  ["#9ad6e8", "#4f8fc0", "#35456d"], // fjord
] as const;

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function coverFor(seed: string) {
  const h = hash(seed);
  const [light, mid, deep] = SKIES[h % SKIES.length];
  const angle = 140 + (h % 60);
  const sunX = 20 + ((h >> 8) % 60);
  return {
    background: `radial-gradient(circle at ${sunX}% 18%, ${light} 0%, transparent 42%), linear-gradient(${angle}deg, ${light} 0%, ${mid} 48%, ${deep} 100%)`,
    accent: mid,
  };
}

export function initials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}
