import { BarChart2, PieChart, Activity, Calendar, TrendingUp as TrendingUpIcon, Radar } from "lucide-react";

// ─── Utility ──────────────────────────────────────────────────────────────────
export const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
export const fmtShort = (n) => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return fmt(n);
};

// ─── Empty Chart Component ────────────────────────────────────────────────────
export function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center h-20 border-2 border-dashed border-zinc-800 rounded-none text-zinc-700 text-xs uppercase tracking-widest">
      {label}
    </div>
  );
}

// ─── Chart: Minimal Bar ───────────────────────────────────────────────────────
export function BarChart({ data, height = 120 }) {
  if (!data.length) return <EmptyChart label="Add transactions to see bar chart" />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {fmtShort(d.value)}
          </span>
          <div
            className="w-full rounded-none transition-all duration-500"
            style={{
              height: `${Math.max(2, (d.value / max) * (height - 28))}px`,
              background: d.type === "income" ? "#10b981" : "#ef4444",
            }}
          />
          <span className="text-[9px] text-zinc-600 truncate w-full text-center uppercase tracking-wide">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart: Donut ─────────────────────────────────────────────────────────────
export function DonutChart({ segments, size = 120 }) {
  if (!segments.length) return <EmptyChart label="No expense data yet" />;
  const r = 38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((s, d) => s + d.value, 0);
  const colors = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  const arcs = segments.map((seg, i) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={colors[i % colors.length]}
        strokeWidth="20"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset * circumference}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    );
    offset += pct;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="rotate-[-90deg] flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f1f1f" strokeWidth="20" />
        {arcs}
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-none flex-shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="text-zinc-400 uppercase tracking-wide truncate">{s.label}</span>
            <span className="text-zinc-300 ml-auto pl-2 tabular-nums font-bold">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart: Sparkline ─────────────────────────────────────────────────────────
export function Sparkline({ points, width = 200, height = 40, color = "#10b981" }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  
  const pts = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      const clampedY = Math.max(0, Math.min(height, y));
      return `${x},${clampedY}`;
    })
    .join(" ");
    
  return (
    <svg width={width} height={height} className="overflow-visible" style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill="url(#gradient)"
        opacity="0.3"
      />
    </svg>
  );
}

// ─── Chart: Forecast Line (with trend prediction) ─────────────────────────────
export function ForecastChart({ historical, predicted, width = 450, height = 120 }) {
  if (historical.length < 2) return <EmptyChart label="Need 3+ months of data for forecast" />;
  
  const allPoints = [...historical, ...predicted];
  const max = Math.max(...allPoints.map(p => p.value), 1);
  const min = Math.min(...allPoints.map(p => p.value), 0);
  const range = max - min || 1;
  
  const historicalPoints = historical.map((p, i) => {
    const x = (i / (historical.length + predicted.length - 1)) * width;
    const y = height - ((p.value - min) / range) * (height - 10);
    return `${x},${Math.max(0, Math.min(height, y))}`;
  }).join(" ");
  
  const startIndex = historical.length - 1;
  const predictedPoints = predicted.map((p, i) => {
    const x = ((startIndex + i) / (historical.length + predicted.length - 1)) * width;
    const y = height - ((p.value - min) / range) * (height - 10);
    return `${x},${Math.max(0, Math.min(height, y))}`;
  }).join(" ");
  
  const confidenceUpper = predicted.map((p, i) => {
    const x = ((startIndex + i) / (historical.length + predicted.length - 1)) * width;
    const y = height - ((p.upper - min) / range) * (height - 10);
    return `${x},${Math.max(0, Math.min(height, y))}`;
  }).join(" ");
  
  const confidenceLower = predicted.map((p, i) => {
    const x = ((startIndex + i) / (historical.length + predicted.length - 1)) * width;
    const y = height - ((p.lower - min) / range) * (height - 10);
    return `${x},${Math.max(0, Math.min(height, y))}`;
  }).join(" ");
  
  return (
    <div className="relative w-full">
      <svg width={width} height={height} className="overflow-visible">
        {predicted.length > 0 && (
          <polygon
            points={`${confidenceLower.split(" ")[0]} ${height} ${confidenceLower} ${confidenceUpper.split(" ").reverse().join(" ")} ${height}`}
            fill="rgba(59, 130, 246, 0.15)"
          />
        )}
        <polyline points={historicalPoints} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={predictedPoints} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" strokeLinejoin="round" />
        {historical.map((p, i) => {
          const x = (i / (historical.length + predicted.length - 1)) * width;
          const y = height - ((p.value - min) / range) * (height - 10);
          return <circle key={i} cx={x} cy={Math.max(0, Math.min(height, y))} r="3" fill="#10b981" />;
        })}
      </svg>
      <div className="flex justify-between text-[9px] text-zinc-700 mt-2 font-bold uppercase tracking-wide">
        <span>PAST</span>
        <span>FORECAST →</span>
      </div>
      <div className="flex gap-3 mt-2 justify-end">
        <span className="flex items-center gap-1.5 text-[9px] text-zinc-600">
          <span className="w-3 h-0.5 bg-emerald-500" /> HISTORICAL
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-zinc-600">
          <span className="w-3 h-0.5 bg-blue-500 border-0 border-dashed" style={{ borderTop: "2px dashed #3b82f6", background: "none" }} /> FORECAST
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-zinc-600">
          <span className="w-3 h-2 bg-blue-500/15 border border-blue-500/30" /> CONFIDENCE
        </span>
      </div>
    </div>
  );
}

// ─── Chart: Radar Chart for Category Comparison (Expense only) ────────────────
export function RadarChart({ categories, values, size = 200 }) {
  if (!categories.length || values.every(v => v === 0)) {
    return <EmptyChart label="Add expenses to see radar chart" />;
  }
  
  const center = size / 2;
  const radius = size * 0.35;
  const angles = categories.map((_, i) => (i * 2 * Math.PI / categories.length) - Math.PI / 2);
  const maxValue = Math.max(...values, 1);
  
  const grids = [0.2, 0.4, 0.6, 0.8, 1].map(level => {
    const r = radius * level;
    return (
      <circle
        key={level}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#27272a"
        strokeWidth="0.5"
        strokeDasharray="3,3"
      />
    );
  });
  
  const axes = angles.map((angle, i) => {
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#27272a" strokeWidth="0.5" />;
  });
  
  const points = values.map((value, i) => {
    const r = (value / maxValue) * radius;
    const x = center + r * Math.cos(angles[i]);
    const y = center + r * Math.sin(angles[i]);
    return `${x},${y}`;
  }).join(" ");
  
  const labels = categories.map((label, i) => {
    const angle = angles[i];
    const r = radius + 12;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    const textAnchor = x > center ? "start" : x < center ? "end" : "middle";
    const dy = y > center ? "0.3em" : y < center ? "-0.3em" : "0";
    const shortLabel = label === "Entertainment" ? "ENT" : label === "Transport" ? "TRN" : label.slice(0, 4).toUpperCase();
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor={textAnchor}
        dy={dy}
        fontSize="8"
        fill="#a1a1aa"
        className="uppercase tracking-wide font-bold"
      >
        {shortLabel}
      </text>
    );
  });
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        {grids}
        {axes}
        <polygon points={points} fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" strokeWidth="2" />
        {values.map((value, i) => {
          const r = (value / maxValue) * radius;
          const x = center + r * Math.cos(angles[i]);
          const y = center + r * Math.sin(angles[i]);
          return <circle key={i} cx={x} cy={y} r="3" fill="#8b5cf6" />;
        })}
        {labels}
      </svg>
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        {categories.map((cat, i) => (
          <span key={i} className="text-[8px] text-zinc-500 uppercase tracking-wide">{cat}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Chart: Horizontal Bars ─────────────────────────────────────────────
export function HorizontalBars({ data }) {
  if (!data.length) return <EmptyChart label="Add expense transactions" />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
  
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 uppercase tracking-wide font-bold">{d.label}</span>
            <span className="text-zinc-300 tabular-nums font-bold">{fmt(d.value)}</span>
          </div>
          <div className="h-[4px] bg-zinc-800 rounded-none overflow-hidden">
            <div
              className="h-full rounded-none transition-all duration-700"
              style={{ 
                width: `${(d.value / max) * 100}%`,
                background: colors[i % colors.length]
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chart: Monthly Income vs Expense ────────────────────────────────────────
export function GroupedBars({ data, height = 100 }) {
  if (!data.length) return <EmptyChart label="Add transactions across months" />;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: height + 24 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
          <div className="flex items-end gap-0.5 w-full" style={{ height }}>
            <div
              className="flex-1 rounded-none transition-all duration-500"
              style={{ height: `${Math.max(2, (d.income / max) * height)}px`, background: "#10b981" }}
              title={`Income: ${fmt(d.income)}`}
            />
            <div
              className="flex-1 rounded-none transition-all duration-500"
              style={{ height: `${Math.max(2, (d.expense / max) * height)}px`, background: "#ef4444" }}
              title={`Expense: ${fmt(d.expense)}`}
            />
          </div>
          <span className="text-[9px] text-zinc-600 uppercase tracking-wide font-bold">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card Component ──────────────────────────────────────────────────────
export function KPICard({ label, value, sub, positive, spark, balance }) {
  return (
    <div className="border-2 border-zinc-900 rounded-none p-4 space-y-3">
      <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase font-bold">{label}</p>
      <p className={`text-2xl font-bold tabular-nums tracking-tighter ${positive ? "text-white" : "text-zinc-400"}`}>{value}</p>
      <div className="flex items-end justify-between">
        <p className="text-[10px] text-zinc-700 font-bold tracking-wide">{sub}</p>
        {spark && spark.length > 1 && (
          <Sparkline points={spark} width={60} height={24} color={balance >= 0 ? "#10b981" : "#ef4444"} />
        )}
      </div>
    </div>
  );
}

// ─── Transaction Row Component ────────────────────────────────────────────────
export function TransactionRow({ transaction, onDelete, isLast }) {
  return (
    <li
      className={`flex items-center gap-4 px-5 py-3.5 group hover:bg-zinc-950 transition-colors ${
        !isLast ? "border-b-2 border-zinc-900" : ""
      }`}
    >
      <span className={`w-1 h-6 rounded-none flex-shrink-0 ${transaction.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate uppercase tracking-wide font-bold">{transaction.description}</p>
        <p className="text-[10px] text-zinc-700 tabular-nums mt-0.5 uppercase tracking-wide">
          {transaction.category.toUpperCase()} · {transaction.date}
        </p>
      </div>
      <span className={`text-sm tabular-nums font-bold ${transaction.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
        {transaction.type === "income" ? "+" : "−"}{fmt(transaction.amount)}
      </span>
      <button
        onClick={() => onDelete(transaction.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-none hover:bg-zinc-900 text-zinc-700 hover:text-white"
        title="Delete"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </li>
  );
}