const COLORS = [
  "#155dfc", // Blue
  "#8b7bc8", // Lavender
  "#e8b339", // Gold
  "#6da889", // Sage
  "#e58270", // Coral
  "#cf80a7", // Rose
  "#49a6b5", // Teal
  "#e5a165", // Apricot
  "#7294d4", // Soft blue
  "#a2ad64", // Olive
];

const SHAPES = [
  <path key="worm" d="M3 17C3 4 10 4 10 12S18 21 21 7" />,
  <circle key="circle" cx="12" cy="12" r="5" />,
  <path key="arrow" d="M3 20C17 20 5 5 19 5M14 2L20 5L17 10" />,
  <rect key="rectangle" x="8" y="4" width="7" height="15" rx="1" />,
  <path key="arc" d="M4 5Q6 21 20 16" />,
  <path key="sparkle" d="M12 3Q13 11 21 12Q13 13 12 21Q11 13 3 12Q11 11 12 3Z" />,
  <path key="zigzag" d="M4 19L9 5L14 19L20 5" />,
  <path key="diamond" d="M12 3L20 12L12 21L4 12Z" />,
  <path key="loop" d="M3 18C3 8 18 3 19 10C20 17 8 18 9 11C10 5 20 5 22 3" />,
  <path key="rays" d="M5 17L3 10M11 14L12 4M17 17L22 10" />,
  <circle key="dot" cx="12" cy="12" r="3" fill="currentColor" stroke="none" />,
  <path key="dash" d="M8 5L16 19" />,
];

const DOODLES = [
  { x: 8, y: 12, size: 20, rotate: -25, shape: 0, color: 1 },
  { x: 30, y: -5, size: 14, rotate: 20, shape: 3, color: 2 },
  { x: 66, y: -7, size: 12, rotate: 0, shape: 1, color: 3 },
  { x: 94, y: 13, size: 22, rotate: 30, shape: 2, color: 0 },
  { x: -9, y: 42, size: 13, rotate: 0, shape: 1, color: 0 },
  { x: 108, y: 44, size: 18, rotate: -20, shape: 4, color: 2 },
  { x: -3, y: 75, size: 16, rotate: -35, shape: 3, color: 3 },
  { x: 102, y: 77, size: 20, rotate: 35, shape: 0, color: 1 },
  // Extra decorations stay outside the chart's circular outline.
  { x: -9, y: 4, size: 13, rotate: -18, shape: 5, color: 4 },
  { x: 17, y: -8, size: 9, rotate: 15, shape: 10, color: 6 },

  { x: 10, y: 92, size: 17, rotate: -35, shape: 2, color: 4 },
  { x: 25, y: 102, size: 10, rotate: 0, shape: 10, color: 9 },
  { x: 76, y: 102, size: 13, rotate: 25, shape: 7, color: 5 },
  { x: 93, y: 96, size: 14, rotate: 20, shape: 4, color: 6 },
];

export default function DoodleConfetti() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      {DOODLES.map((doodle, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute overflow-visible"
          style={{
            left: `${doodle.x}%`,
            top: `${doodle.y}%`,
            width: doodle.size,
            height: doodle.size,
            color: COLORS[doodle.color],
            transform: `translate(-50%, -50%) rotate(${doodle.rotate}deg)`,
          }}
        >
          {SHAPES[doodle.shape]}
        </svg>
      ))}
    </div>
  );
}
