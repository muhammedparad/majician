import React from 'react';
import { Link } from 'react-router-dom';
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
  goalLabel?: string;
  insightQuote?: string;
  insightLabel?: string;
  activityLink?: string;
  activities?: ActivityItem[];
}

export const RightRail: React.FC<RightRailProps> = ({
  goalTitle = 'Family support',
  goalRaised = 7200,
  goalTarget = 10000,
  goalLabel = 'ASSISTANCE GOAL',
  insightQuote = '“Your contributions are helping eligible families in your community.”',
  insightLabel = 'ZAKAT INSIGHT',
  activityLink = '/app/manage/ledger',
  activities
}) => {
  const goalPct = Math.round((goalRaised / goalTarget) * 100);

  const defaultActivities: ActivityItem[] = [
    {
      icon: 'users',
      cls: 'amber',
      title: 'Manual handover recorded',
      amount: '−₹8,80,426',
      isPlus: false
    },
    {
      icon: 'hand',
      cls: '',
      title: 'Assistance received',
      amount: '+₹15,000',
      isPlus: true
    },
    {
      icon: 'heart',
      cls: '',
      title: 'Zakat contribution',
      amount: '−₹20,000',
      isPlus: false
    }
  ];

  const items = activities || defaultActivities;

  const mahallusData: [string, string, string, string][] = [
    ['Kannur Mahallu', '1,420 members', '₹1,26,840', '+12.4%'],
    ['Kozhikode Mahallu', '980 members', '₹74,220', '+8.6%'],
    ['Malappuram Mahallu', '650 members', '₹28,410', '+21.8%'],
    ['Wayanad Mahallu', '320 members', '₹19,150', '+2.1%']
  ];

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
          ₹{goalRaised.toLocaleString('en-IN')} of ₹{goalTarget.toLocaleString('en-IN')} · {goalPct}%
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
          {items.map((a, i) => (
            <div key={i} className="act-row">
              {renderIcon(a.icon, a.cls)}
              <div className="grow">
                <div className="t">{a.title}</div>
                {a.detail && <div className="d">{a.detail}</div>}
              </div>
              <div className={`amt ${a.isPlus ? 'plus' : ''}`}>{a.amount}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Community Activity Card */}
      <section className="card" aria-label="Community activity">
        <div className="eyebrow">
          <span className="dot"></span>COMMUNITY ACTIVITY
        </div>
        <div style={{ display: 'flex', gap: 18, margin: '12px 0 4px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: 'var(--ink2)' }}>24</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>new applications</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: 'var(--ink2)' }}>−8%</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>vs last month</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: 'var(--ink2)' }}>₹12,48,620</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>total distributed</div>
          </div>
        </div>

        {mahallusData.map((m) => (
          <div key={m[0]} className="mahallu-row">
            <span className="dotm"></span>
            <div className="grow">
              <div className="n">{m[0]}</div>
              <div className="m">{m[1]}</div>
            </div>
            <div>
              <div className="amt">{m[2]}</div>
              <div className="chg">{m[3]}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
