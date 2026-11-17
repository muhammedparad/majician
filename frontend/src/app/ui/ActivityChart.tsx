import React from 'react';

export type MonthlyPoint = {
  month?: string;
  label: string;
  amount: number;
};

function formatCompactInr(amount: number): string {
  if (amount <= 0) return '₹0';
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const ActivityChart: React.FC<{ data?: MonthlyPoint[]; emptyText?: string }> = ({
  data,
  emptyText = 'Confirmed contributions will appear here by month as payments are recorded.',
}) => {
  const points = data ?? [];
  const max = points.reduce((best, item) => Math.max(best, item.amount), 0);

  if (points.length === 0 || max <= 0) {
    return (
      <div className="empty" style={{ padding: '28px 16px' }}>
        <h3>No monthly collections yet</h3>
        <p>{emptyText}</p>
      </div>
    );
  }

  const W = 560;
  const H = 190;
  const base = 158;
  const bw = 46;
  const gap = (W - 40) / points.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Monthly confirmed Udhiyya collections"
      style={{ display: 'block' }}
    >
      <line x1="14" y1={base} x2={W - 8} y2={base} stroke="#dce8e0" strokeWidth="1.5" />
      {points.map((d, i) => {
        const h = d.amount > 0 ? Math.max(8, Math.round((d.amount / max) * (base - 34))) : 4;
        const x = 26 + i * gap + (gap - bw) / 2;
        const y = base - h;
        const isHighlight = d.amount === max && max > 0;

        return (
          <g key={d.month ?? d.label}>
            <rect
              className="chart-bar"
              x={x}
              y={y}
              width={bw}
              height={h}
              rx={9}
              fill={isHighlight ? '#0e5c48' : d.amount > 0 ? '#cfe3d8' : '#edf3ef'}
              style={{ '--bar-d': `${i * 55}ms`, cursor: 'pointer' } as React.CSSProperties}
            />
            <text
              className="chart-val"
              x={x + bw / 2}
              y={y - 9}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="700"
              fill={d.amount > 0 ? '#22302a' : '#8b9b94'}
              fontFamily="var(--font-head)"
              style={{ '--bar-d': `${i * 55}ms` } as React.CSSProperties}
            >
              {formatCompactInr(d.amount)}
            </text>
            <text
              x={x + bw / 2}
              y={base + 22}
              textAnchor="middle"
              fontSize="11"
              fill="#5f706a"
              fontFamily="var(--font-mono)"
            >
              {d.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
