/* Hand-drawn chalk food doodles scattered across the wallpaper.
   Pure decoration: the container is pointer-events-none and aria-hidden. */

const ART = {
  burger: '<path d="M14 44C14 27 30 17 50 17s36 10 36 27H14Z" /><path d="M30 26c1.5 1 1.5 2 0 3M43 22c1.5 1 1.5 2 0 3M57 22c1.5 1 1.5 2 0 3M70 27c1.5 1 1.5 2 0 3" /><path d="M10 50c5-4 10 4 15 0s10 4 15 0 10 4 15 0 10 4 15 0 10 4 15 0" /><path d="M13 57c6 2 12-2 18 0s12 2 18 0 12-2 18 0 12 2 18 0" /><path d="M16 63h68l-2 6H18l-2-6Z" /><path d="M18 73h64c0 8-7 13-16 13H34c-9 0-16-5-16-13Z" /><path d="M30 79h40" />',
  cup: '<path d="M30 30h40l-5 56H35l-5-56Z" /><path d="M26 30h48" /><path d="M39 30c0-7 4-11 11-11s11 4 11 11" /><path d="M55 19 64 5" /><path d="M36 44h12v10H36zM50 51h12v10H50zM37 63h12v10H37z" /><path d="M63 41a6 6 0 1 0 6 6" />',
  ramen: '<path d="M18 46c0-15 14-24 32-24s32 9 32 24H18Z" /><path d="M33 30c1.5 1 1.5 2 0 3M48 26c1.5 1 1.5 2 0 3M62 30c1.5 1 1.5 2 0 3" /><path d="M14 52c6-4 12 4 18 0s12 4 18 0 12 4 18 0 12 4 18 0" /><path d="M20 59h60l-3 7H23l-3-7Z" /><path d="M22 70h56c0 8-6 12-14 12H36c-8 0-14-4-14-12Z" />',
  glass: '<path d="M30 80 44 24h12l14 56c-13 5-27 5-40 0Z" /><path d="M40 38c7 3 13 3 20 0M35 58c10 4 20 4 30 0" /><path d="M44 22c1-7 10-9 12-2" /><circle cx="61" cy="15" r="4" /><circle cx="43" cy="40" r="1.5" /><circle cx="58" cy="50" r="1.5" /><circle cx="47" cy="63" r="1.5" />',
  fries: '<path d="M28 44h44l-6 42H34l-6-42Z" /><path d="M31 57h38M33 70h34" /><path d="M32 44V21M39 44V13M46 44V18M53 44V11M60 44V17M67 44V24" /><path d="M26 44h48" /><circle cx="42" cy="52" r="1" /><circle cx="55" cy="61" r="1" /><circle cx="48" cy="76" r="1" />',
  pizza: '<path d="M50 12 78 80c-18 6-38 6-56 0L50 12Z" /><path d="M26 64c15 6 33 6 48 0" /><path d="M50 12c-7 1-12 4-16 9 10 4 22 4 32 0-4-5-9-8-16-9Z" /><circle cx="44" cy="38" r="3.5" /><circle cx="56" cy="49" r="3.5" /><circle cx="44" cy="60" r="3" />',
  taco: '<path d="M12 60c5-18 20-30 38-30s33 12 38 30c-24 10-52 10-76 0Z" /><path d="M18 55c10-6 20-9 32-9s22 3 32 9" /><path d="M22 63c4-3 8 2 12-1s8 2 12-1 8 2 12-1 8 2 12-1" /><path d="M34 68c10 3 22 3 32 0" /><circle cx="36" cy="46" r="2.5" /><circle cx="50" cy="42" r="2.5" /><circle cx="64" cy="47" r="2.5" />',
  kettle: '<path d="M32 28h36l-4 58H36l-4-58Z" /><path d="M28 28h44" /><path d="M40 28c0-6 4-10 10-10s10 4 10 10" /><path d="M53 18 61 4" /><path d="M37 42h11v9H37zM50 49h11v9H50zM38 61h11v9H38z" /><path d="M64 38a6 6 0 1 0 7 6" />',
  sub: '<path d="M14 62c0-16 14-28 36-28s36 12 36 28c0 8-8 12-18 12H32c-10 0-18-4-18-12Z" /><path d="M20 56c14 5 46 5 60 0" /><path d="M30 41c2-3 5-3 7 0M44 37c2-3 5-3 7 0M58 39c2-3 5-3 7 0" /><path d="M28 66c8 3 36 3 44 0" />',
  chefhat: '<path d="M30 74V52c-8-2-13-8-13-16 0-9 8-16 17-16 3-6 9-10 16-10s13 4 16 10c9 0 17 7 17 16 0 8-5 14-13 16v22Z" /><path d="M28 74h44" /><path d="M34 62h32M34 68h32" />',
  coffee: '<path d="M24 40h44v18c0 9-7 16-16 16H40c-9 0-16-7-16-16V40Z" /><path d="M68 46h6a7 7 0 0 1 0 14h-6" /><path d="M18 80h56" /><path d="M36 32c0-5 4-6 4-10M48 32c0-5 4-6 4-10M60 32c0-5 4-6 4-10" />',
  donut: '<circle cx="50" cy="52" r="28" /><circle cx="50" cy="52" r="9" /><path d="M34 34c3 2 6 2 9 0M60 40c3 2 6 2 9 0M30 58c3 2 6 2 9 0M58 66c3 2 6 2 9 0M48 30c3 2 6 2 9 0M40 70c2 2 5 2 7 0" />',
  chicken: '<path d="M70 20c8-2 15 4 13 12-2 9-11 14-19 12l-9 9c-4 4-10 4-13 0s-4-9 0-13l9-9c-2-8 3-17 12-19" /><circle cx="37" cy="67" r="7" /><path d="M31 74l-6 6" />'
};

/* 7 x 4 grid — every cell gets one doodle so no large empty patches remain. */
const ARTS = [
  'burger', 'fries', 'pizza', 'cup', 'sub', 'taco', 'chefhat',
  'coffee', 'donut', 'chicken', 'ramen', 'glass', 'kettle', 'burger'
];
const COLS = 7;
const ROWS = 4;
const SCATTER = [];

for (let row = 0; row < ROWS; row += 1) {
  for (let col = 0; col < COLS; col += 1) {
    const index = row * COLS + col;
    // deterministic jitter keeps the grid organic but avoids overlap
    const jitterX = ((index * 37) % 7) - 3;
    const jitterY = ((index * 53) % 9) - 4;
    SCATTER.push({
      art: ARTS[index % ARTS.length],
      x: Number(((col + 0.5) * (100 / COLS) + jitterX).toFixed(2)),
      y: Number(((row + 0.5) * (100 / ROWS) + jitterY).toFixed(2)),
      size: 75 + ((index * 13) % 36),
      rotate: -25 + ((index * 17) % 54),
      opacity: Number((0.2 + (index % 4) * 0.02).toFixed(2))
    });
  }
}

export function renderDoodles(root) {
  if (!root) return;
  root.innerHTML = SCATTER.map(({ art, x, y, size, rotate, opacity }) =>
    `<svg viewBox="0 0 100 100" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;transform:translate(-50%,-50%) rotate(${rotate}deg);opacity:${opacity}">${ART[art]}</svg>`
  ).join('');
}
