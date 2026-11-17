import React from 'react';

export const ActivityChart: React.FC = () => {
  const data: [string, number][] = [
    ['Jan', 6],
    ['Feb', 9],
    ['Mar', 14],
    ['Apr', 11],
    ['May', 18],
    ['Jun', 13]
  ];

  const max = 18;
  const W = 560;
  const H = 190;
  const base = 158;
  const bw = 46;
  const gap = (W - 40) / 6;

  return (
    <svg 
      viewBox={`0 0 ${W} ${H}`} 
      width="100%" 
      role="img" 
      aria-label="Monthly activity across the Mahallu network, January to June, in thousands of rupees" 
      style={{ display: 'block' }}
    >
      <line x1="14" y1={base} x2={W - 8} y2={base} stroke="#dce8e0" strokeWidth="1.5" />
      {data.map((d, i) => {
        const h = Math.round((d[1] / max) * (base - 34));
        const x = 26 + i * gap + (gap - bw) / 2;
        const y = base - h;
        const isHighlight = i === 4; // May peak

        return (
          <g key={d[0]}>
            <rect 
              x={x} 
              y={y} 
              width={bw} 
              height={h} 
              rx={9} 
              fill={isHighlight ? '#0e5c48' : '#cfe3d8'} 
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
            />
            <text 
              x={x + bw / 2} 
              y={y - 9} 
              textAnchor="middle" 
              fontSize="11.5" 
              fontWeight="700" 
              fill="#22302a" 
              fontFamily="var(--font-head)"
            >
              ₹{d[1]}k
            </text>
            <text 
              x={x + bw / 2} 
              y={base + 22} 
              textAnchor="middle" 
              fontSize="11" 
              fill="#5f706a" 
              fontFamily="var(--font-mono)"
            >
              {d[0].toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
