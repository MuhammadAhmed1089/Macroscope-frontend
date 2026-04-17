import { useState, useEffect } from "react";

const FUNCTIONS = [
  { id: 1, label: "Top 10 by GDP",        icon: "🏆", hint: "Highest economies" },
  { id: 2, label: "Bottom 10 by GDP",     icon: "📉", hint: "Smallest economies" },
  { id: 3, label: "GDP Growth Rate",      icon: "📈", hint: "Year-over-year change" },
  { id: 4, label: "Avg GDP by Continent", icon: "🌍", hint: "Continental averages" },
  { id: 5, label: "Global GDP Trends",    icon: "🌐", hint: "Worldwide over time" },
  { id: 6, label: "Fastest Continent",    icon: "🚀", hint: "Highest growth pace" },
  { id: 7, label: "Consistent Decline",   icon: "⬇️", hint: "Sustained contraction" },
  { id: 8, label: "GDP Contribution",     icon: "🥧", hint: "Share of world GDP" },
];

const CONTINENTS = ["Asia","Europe","Africa","North America","South America","Oceania"];

export default function ConfigEditor({ value, onChange }) {
  const selectedFn = value ? parseInt(value.FunctionOption) : null;

  const setFn = (id) => {
    if (!value) return;
    const u = { ...value, FunctionOption: String(id) };
    onChange(u);
  };

  const setParam = (key, val) => {
    if (!value) return;
    onChange({ ...value, parameters: { ...value.parameters, [key]: val } });
  };

  const setYearRange = (sub, val) => {
    if (!value) return;
    onChange({
      ...value,
      parameters: {
        ...value.parameters,
        YearRange: { ...value.parameters?.YearRange, [sub]: parseInt(val) || val }
      }
    });
  };

  return (
    <div>
      <div className="fn-grid">
        {FUNCTIONS.map(fn => (
          <button
            key={fn.id}
            className={`fn-card ${selectedFn === fn.id ? "active" : ""}`}
            onClick={() => setFn(fn.id)}
            type="button"
          >
            <div className="fn-icon-wrap">{fn.icon}</div>
            <div>
              <div className="fn-card-name">{fn.label}</div>
              <div className="fn-card-hint">{fn.hint}</div>
            </div>
          </button>
        ))}
      </div>

      {value && (
        <div className="params-section">
          <div className="params-row">
            <div className="field-wrap">
              <label>Start Year</label>
              <input
                type="number"
                className="field-input"
                placeholder="2010"
                value={value?.parameters?.YearRange?.startYear ?? ""}
                onChange={e => setYearRange("startYear", e.target.value)}
              />
            </div>
            <div className="field-wrap">
              <label>End Year</label>
              <input
                type="number"
                className="field-input"
                placeholder="2021"
                value={value?.parameters?.YearRange?.EndYear ?? ""}
                onChange={e => setYearRange("EndYear", e.target.value)}
              />
            </div>
            <div className="field-wrap">
              <label>Target Year</label>
              <input
                type="number"
                className="field-input"
                placeholder="2023"
                value={value?.parameters?.year ?? ""}
                onChange={e => setParam("year", parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="field-wrap">
            <label>Continent Filter</label>
            <select
              className="continent-select"
              value={value?.parameters?.continent ?? "Asia"}
              onChange={e => setParam("continent", e.target.value)}
            >
              {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
