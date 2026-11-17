import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatedNumber } from '../../features/motion/primitives';
import { IconHand, IconHeart, IconShield, IconUsers } from './Icons';
import { KnowMore } from './KnowMore';

export type ActivityItem = {
  icon: 'hand' | 'users' | 'heart' | 'shield';
  cls?: string;
  title: string;
  detail?: string;
  amount: string;
  isPlus?: boolean;
};

export interface RightRailProps {
  goalTitle?: string;
  goalRaised?: number;
  goalTarget?: number;
  goalUnit?: 'currency' | 'packets';
  goalLabel?: string;
  insightQuote?: string;
  insightLabel?: string;
  activityLink?: string;
  activities?: ActivityItem[];
}

export const RightRail: React.FC<RightRailProps> = ({
  goalTitle = 'Udhiyya Collection',
  goalRaised = 0,
  goalTarget = 0,
  goalUnit = 'currency',
  goalLabel = 'UDHIYYA GOAL',
  insightQuote = '“Your Udhiyya contributions and shares are distributed directly to eligible families across your Mahallu for Eid.”',
  insightLabel = 'EID INSIGHT',
  activityLink = '/app/manage/ledger',
  activities = [],
}) => {
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalRaised / goalTarget) * 100)) : 0;
  const items = activities;

  const renderIcon = (type: string, cls = '') => {
    switch (type) {
      case 'hand':
        return (
          <span className={`ic ${cls}`}>
            <IconHand />
          </span>
        );
      case 'users':
        return (
          <span className={`ic ${cls}`}>
            <IconUsers />
          </span>
        );
      case 'shield':
        return (
          <span className={`ic ${cls}`}>
            <IconShield />
          </span>
        );
      case 'heart':
      default:
        return (
          <span className={`ic ${cls}`}>
            <IconHeart />
          </span>
        );
    }
  };

  return (
    <div className="rail">
      {/* 1. Goal Card */}
      <section className="card" aria-label="Assistance goal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow" style={{ margin: 0 }}>
            <span className="dot"></span>
            {goalLabel}
          </div>
          <KnowMore title={goalTitle} ariaLabel="Know more about this goal">
            <p style={{ margin: 0 }}>
              A collective community fund raised by verified members to provide direct support and allocations this season.
            </p>
          </KnowMore>
        </div>
        <h3 style={{ fontSize: 19, margin: '10px 0 4px' }}>{goalTitle}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          {goalUnit === 'packets' ? (
            <>
              <AnimatedNumber value={goalRaised} /> of {goalTarget.toLocaleString('en-IN')} packets · <AnimatedNumber value={goalPct} />%
            </>
          ) : (
            <>
              ₹<AnimatedNumber value={goalRaised} /> of ₹{goalTarget.toLocaleString('en-IN')} · <AnimatedNumber value={goalPct} />%
            </>
          )}
        </p>
        <div className="progress" style={{ marginTop: 12 }}>
          <i style={{ width: `${goalPct}%` }}></i>
        </div>
      </section>

      {/* 2. Insight Card */}
      <section className="card" aria-label="Insight quote">
        <div className="eyebrow">
          <span className="dot"></span>
          {insightLabel}
        </div>
        <p style={{ fontSize: 16.5, color: 'var(--ink2)', marginTop: 10, lineHeight: 1.5 }}>
          {insightQuote}
        </p>
      </section>

      {/* 3. Recent Activity Card */}
      <section className="card" aria-label="Recent activity">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: 18 }}>Recent activity</h3>
          <Link
            to={activityLink}
            style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13.5, minHeight: 36, display: 'inline-flex', alignItems: 'center' }}
          >
            See all
          </Link>
        </div>
        <div style={{ marginTop: 6 }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--muted)', padding: '12px 0 4px', margin: 0 }}>
              No recent activity yet.
            </p>
          ) : (
            items.map((a, i) => (
              <div key={i} className="act-row">
                {renderIcon(a.icon, a.cls)}
                <div className="grow">
                  <div className="t">{a.title}</div>
                  {a.detail && <div className="d">{a.detail}</div>}
                </div>
                <div className={`amt ${a.isPlus ? 'plus' : ''}`}>{a.amount}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
