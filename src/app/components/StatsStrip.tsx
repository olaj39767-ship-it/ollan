"use client";

import { FC } from "react";

interface StatItem {
  value: string;
  label: string;
  accent: string;
}

const stats: StatItem[] = [
  { value: "28K+",    label: "Happy customers", accent: "#FF3B1F" },
  { value: "4.9★",   label: "Average rating",   accent: "#FF6B35" },
  { value: "<45 min", label: "Avg. delivery",    accent: "#FF3B1F" },
  { value: "99.2%",  label: "On-time rate",      accent: "#FF6B35" },
];

export const StatsStrip: FC = () => {
  return (
    <div style={{ width: "100%", maxWidth: 1100, padding: "0 16px", margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&display=swap');

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 20px 0;
        }

        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
          }
        }

        .stat-card {
          position: relative;
          background: #ffffff;
          border-radius: 14px;
          padding: 20px 14px 18px;
          text-align: center;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--accent);
          border-radius: 14px 14px 0 0;
        }

        .stat-card::after {
          content: '';
          position: absolute;
          bottom: -30px;
          right: -20px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
          opacity: 0.07;
          pointer-events: none;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1), 0 0 0 1.5px var(--accent);
        }

        .stat-card:hover::after {
          opacity: 0.12;
        }

        .stat-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 0.02em;
          line-height: 1;
          background: linear-gradient(135deg, #111 40%, var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (min-width: 640px) {
          .stat-value {
            font-size: 36px;
          }
        }

        .stat-divider {
          width: 20px;
          height: 1.5px;
          background: var(--accent);
          margin: 8px auto 0;
          border-radius: 2px;
          opacity: 0.5;
        }

        .stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-top: 6px;
        }
      `}</style>

      <div className="stats-grid">
        {stats.map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ "--accent": s.accent } as React.CSSProperties}
          >
            <div className="stat-value">{s.value}</div>
            <div className="stat-divider" />
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};