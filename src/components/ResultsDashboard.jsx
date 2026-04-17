import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from "recharts";

// Rich, accessible color palette for dark theme
const PALETTE = [
  "#3b82f6","#e8b84b","#10b981","#f87171","#a78bfa",
  "#38bdf8","#fb923c","#4ade80","#f472b6","#facc15"
];

function formatGDP(v) {
  if (v == null) return "N/A";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(2)}`;
}

const CustomTooltip = ({ active, payload, label, isMonetary }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border2)",
      borderRadius: "var(--radius-sm)", padding: "12px 16px",
      boxShadow: "var(--shadow-lg)", minWidth: 160,
    }}>
      <p style={{ color: "var(--text)", fontFamily: "var(--display)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--text2)", fontSize: 12, fontFamily: "var(--mono)" }}>
          {isMonetary ? formatGDP(p.value) : typeof p.value === "number" ? p.value.toFixed(2) + "%" : p.value}
        </p>
      ))}
    </div>
  );
};

function SmartChart({ hint, data }) {
  const { type, x_key, y_key, title, x_label, y_label } = hint || {};
  if (!x_key || !y_key || !data?.length) return null;

  const isMonetary = y_label?.toLowerCase().includes("usd") || y_label?.toLowerCase().includes("gdp");
  const isPercent = y_label?.toLowerCase().includes("%") || y_label?.toLowerCase().includes("rate") || y_label?.toLowerCase().includes("growth");

  const chartData = data.map(r => ({
    ...r,
    [x_key]: String(r[x_key] ?? ""),
    [y_key]: typeof r[y_key] === "number" ? r[y_key] : parseFloat(r[y_key]) || 0,
  }));

  const tickFormatter = isMonetary ? formatGDP : (v) => isPercent ? `${v.toFixed(1)}%` : v;
  const tooltip = <CustomTooltip isMonetary={isMonetary} />;

  const axisStyle = { fill: "var(--text3)", fontSize: 11, fontFamily: "var(--mono)" };
  const gridStyle = { stroke: "rgba(255,255,255,0.04)", strokeDasharray: "4 4" };
  const margin = { top: 10, right: 20, left: 10, bottom: 70 };

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={chartData} dataKey={y_key} nameKey={x_key}
            cx="50%" cy="45%" outerRadius={130} innerRadius={55}
            paddingAngle={2}
            label={({ name, percent }) => percent > 0.04 ? `${(percent * 100).toFixed(1)}%` : ""}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={1}/>
            ))}
          </Pie>
          <Tooltip formatter={(v) => isMonetary ? formatGDP(v) : v} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)" }} labelStyle={{ color: "var(--text)" }} />
          <Legend iconType="circle" formatter={(val) => <span style={{ color: "var(--text2)", fontSize: 12 }}>{val}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData} margin={margin}>
          <defs>
            <linearGradient id="colorGdp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={x_key} tick={axisStyle} angle={-40} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tickFormatter={tickFormatter} tick={axisStyle} width={80} />
          <Tooltip content={tooltip} />
          <Area type="monotone" dataKey={y_key} stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorGdp)" dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // default: bar
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData} margin={margin} barCategoryGap="30%">
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey={x_key} tick={axisStyle} angle={-40} textAnchor="end" interval={0} />
        <YAxis tickFormatter={tickFormatter} tick={axisStyle} width={80} />
        <Tooltip content={tooltip} />
        <Bar dataKey={y_key} radius={[4, 4, 0, 0]} maxBarSize={52}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.9}/>
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function InsightsPanel({ results, chartHint }) {
  const yKey = chartHint?.y_key;
  if (!yKey || !results?.length) return null;

  const nums = results.map(r => parseFloat(r[yKey])).filter(n => !isNaN(n));
  if (!nums.length) return null;

  const sum = nums.reduce((a, b) => a + b, 0);
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const avg = sum / nums.length;
  const isPercent = chartHint?.y_label?.toLowerCase().includes("%");
  const fmt = isPercent ? v => `${v.toFixed(2)}%` : formatGDP;

  const topRow = results.find(r => parseFloat(r[yKey]) === max);
  const topName = topRow ? Object.values(topRow).find((v, i) => i === 0) : null;

  return (
    <div className="insights-grid">
      <div className="insight-card fade-up delay-1">
        <div className="insight-card-icon">📊</div>
        <div className="insight-card-title">Records</div>
        <div className="insight-val">{nums.length}</div>
        <div className="insight-text">Total data points returned</div>
      </div>
      <div className="insight-card fade-up delay-2">
        <div className="insight-card-icon">🏆</div>
        <div className="insight-card-title">Maximum</div>
        <div className="insight-val" style={{color: "var(--gold)"}}>{fmt(max)}</div>
        {topName && <div className="insight-text">{String(topName)}</div>}
      </div>
      <div className="insight-card fade-up delay-3">
        <div className="insight-card-icon">📉</div>
        <div className="insight-card-title">Minimum</div>
        <div className="insight-val" style={{color: "var(--blue2)"}}>{fmt(min)}</div>
        <div className="insight-text">Lowest value in dataset</div>
      </div>
      <div className="insight-card fade-up delay-4">
        <div className="insight-card-icon">⚖️</div>
        <div className="insight-card-title">Average</div>
        <div className="insight-val" style={{color: "var(--emerald)"}}>{fmt(avg)}</div>
        <div className="insight-text">Mean across all records</div>
      </div>
    </div>
  );
}

function ResultsTable({ data }) {
  if (!data?.length) return <div style={{ color: "var(--text3)", padding: 20 }}>No results</div>;
  const keys = Object.keys(data[0]).filter(k => k !== "declineDetails");

  return (
    <div className="table-wrap">
      <table className="results-table">
        <thead>
          <tr>{keys.map(k => <th key={k}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {keys.map(k => {
                const v = row[k];
                const isNum = typeof v === "number";
                const display = isNum && Math.abs(v) > 1e6
                  ? formatGDP(v)
                  : Array.isArray(v) ? v.join(", ")
                  : String(v ?? "");
                return <td key={k} className={isNum ? "num" : ""}>{display}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const chartTypeLabels = { bar: "Bar Chart", line: "Area Chart", pie: "Donut Chart" };

export default function ResultsDashboard({ result, onDownload }) {
  const { analysis_name, record_count, chart_hint, results } = result;

  return (
    <section className="section-enter">
      <div className="results-header-bar">
        <div>
          <div className="results-title">{analysis_name}</div>
          <div className="results-meta">
            <span className="meta-chip">📊 {record_count} records</span>
            {chart_hint?.type && (
              <span className="meta-chip">{chartTypeLabels[chart_hint.type] || chart_hint.type}</span>
            )}
          </div>
        </div>
        <button className="dl-btn" onClick={onDownload}>
          ↓ Download CSV
        </button>
      </div>

      <InsightsPanel results={results} chartHint={chart_hint} />

      <div className="chart-card fade-up delay-2">
        <div className="chart-card-header">
          <div>
            <div className="chart-card-title">{chart_hint?.title || analysis_name}</div>
            <div className="chart-card-sub">{chart_hint?.x_label} vs {chart_hint?.y_label}</div>
          </div>
          {chart_hint?.type && (
            <span className="chart-type-badge">
              {chart_hint.type === "pie" ? "🥧" : chart_hint.type === "line" ? "📈" : "📊"} {chartTypeLabels[chart_hint.type]}
            </span>
          )}
        </div>
        <SmartChart hint={chart_hint} data={results} />
      </div>

      <div className="table-section fade-up delay-3">
        <div className="table-section-header">
          <div className="table-section-title">Raw Data</div>
          <span className="meta-chip">{record_count} rows</span>
        </div>
        <ResultsTable data={results} />
      </div>
    </section>
  );
}
