import { useMemo, useState } from "react";

const SERIES = [
    { key: "income", label: "Pemasukan", color: "#16a34a" },
    { key: "expense", label: "Pengeluaran", color: "#ea580c" },
    { key: "profit", label: "Untung", color: "#2563eb" },
];

const WIDTH = 800;
const HEIGHT = 300;
const PAD_LEFT = 64;
const PAD_RIGHT = 24;
const PAD_TOP = 24;
const PAD_BOTTOM = 32;

function formatCompact(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
    return String(value);
}

function niceTicks(min, max, count = 4) {
    if (min === max) return [min];
    const range = max - min;
    const rawStep = range / count;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else if (residual > 1) step = 2 * magnitude;
    else step = magnitude;

    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v));
    return ticks;
}

function TrendChart({ data }) {
    const [hoverIndex, setHoverIndex] = useState(null);

    const { yMin, yMax, ticks, points } = useMemo(() => {
        const allValues = data.flatMap((d) => [d.income, d.expense, d.profit]);
        const rawMax = Math.max(0, ...allValues);
        const rawMin = Math.min(0, ...allValues);
        const paddedMax = rawMax === 0 ? 1 : rawMax * 1.15;
        const ticks = niceTicks(rawMin, paddedMax);
        const yMin = ticks[0];
        const yMax = ticks[ticks.length - 1];

        const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
        const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

        const xFor = (i) =>
            data.length <= 1
                ? PAD_LEFT + plotW / 2
                : PAD_LEFT + (i / (data.length - 1)) * plotW;

        const yFor = (value) =>
            PAD_TOP + plotH - ((value - yMin) / (yMax - yMin)) * plotH;

        const points = data.map((d, i) => ({
            x: xFor(i),
            income: yFor(d.income),
            expense: yFor(d.expense),
            profit: yFor(d.profit),
        }));

        return { yMin, yMax, ticks, points };
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/50">
                <p className="text-sm font-bold text-gray-400">
                    Belum ada data untuk periode ini.
                </p>
            </div>
        );
    }

    const zeroY =
        PAD_TOP +
        (HEIGHT - PAD_TOP - PAD_BOTTOM) -
        ((0 - yMin) / (yMax - yMin)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

    function pathFor(key) {
        return points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p[key]}`)
            .join(" ");
    }

    // X labels: first, middle, last — enough to orient without clutter.
    const labelIndices =
        data.length <= 3
            ? data.map((_, i) => i)
            : [0, Math.floor((data.length - 1) / 2), data.length - 1];

    function handlePointerMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
        const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
        const ratio = (relX - PAD_LEFT) / plotW;
        const index = Math.round(ratio * (data.length - 1));
        setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
    }

    const hovered = hoverIndex !== null ? data[hoverIndex] : null;
    const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

    return (
        <div>
            {/* LEGEND */}
            <div className="flex flex-wrap gap-5">
                {SERIES.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <span
                            className="h-[2px] w-4 rounded-full"
                            style={{ backgroundColor: s.color }}
                        />
                        <span className="text-xs font-bold text-gray-500">
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="relative mt-4">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="w-full touch-none"
                    onMouseMove={handlePointerMove}
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    {/* GRIDLINES */}
                    {ticks.map((tick) => {
                        const y =
                            PAD_TOP +
                            (HEIGHT - PAD_TOP - PAD_BOTTOM) -
                            ((tick - yMin) / (yMax - yMin)) *
                            (HEIGHT - PAD_TOP - PAD_BOTTOM);

                        return (
                            <g key={tick}>
                                <line
                                    x1={PAD_LEFT}
                                    x2={WIDTH - PAD_RIGHT}
                                    y1={y}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth={1}
                                />
                                <text
                                    x={PAD_LEFT - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize={11}
                                    fontWeight={700}
                                    fill="#9ca3af"
                                >
                                    {formatCompact(tick)}
                                </text>
                            </g>
                        );
                    })}

                    {/* ZERO BASELINE (only drawn distinctly if below range shown, i.e. negative profit exists) */}
                    {yMin < 0 && (
                        <line
                            x1={PAD_LEFT}
                            x2={WIDTH - PAD_RIGHT}
                            y1={zeroY}
                            y2={zeroY}
                            stroke="#d1d5db"
                            strokeWidth={1}
                        />
                    )}

                    {/* X LABELS */}
                    {labelIndices.map((i) => (
                        <text
                            key={i}
                            x={points[i].x}
                            y={HEIGHT - 8}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={700}
                            fill="#9ca3af"
                        >
                            {data[i].label}
                        </text>
                    ))}

                    {/* SERIES LINES */}
                    {SERIES.map((s) => (
                        <path
                            key={s.key}
                            d={pathFor(s.key)}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}

                    {/* END MARKERS + DIRECT LABELS */}
                    {SERIES.map((s) => {
                        const last = points[points.length - 1];
                        return (
                            <g key={s.key}>
                                <circle
                                    cx={last.x}
                                    cy={last[s.key]}
                                    r={4}
                                    fill={s.color}
                                    stroke="#f5f2eb"
                                    strokeWidth={2}
                                />
                            </g>
                        );
                    })}

                    {/* HOVER CROSSHAIR */}
                    {hoveredPoint && (
                        <line
                            x1={hoveredPoint.x}
                            x2={hoveredPoint.x}
                            y1={PAD_TOP}
                            y2={HEIGHT - PAD_BOTTOM}
                            stroke="#9ca3af"
                            strokeWidth={1}
                        />
                    )}

                    {hoveredPoint &&
                        SERIES.map((s) => (
                            <circle
                                key={s.key}
                                cx={hoveredPoint.x}
                                cy={hoveredPoint[s.key]}
                                r={4}
                                fill={s.color}
                                stroke="#f5f2eb"
                                strokeWidth={2}
                            />
                        ))}
                </svg>

                {/* TOOLTIP */}
                {hovered && hoveredPoint && (
                    <div
                        className="pointer-events-none absolute top-0 rounded-xl bg-gray-900 px-4 py-3 text-xs shadow-xl"
                        style={{
                            left: `${(hoveredPoint.x / WIDTH) * 100}%`,
                            transform:
                                hoveredPoint.x > WIDTH * 0.7
                                    ? "translateX(-105%)"
                                    : "translateX(10px)",
                        }}
                    >
                        <p className="mb-2 font-extrabold text-white">
                            {hovered.label}
                        </p>

                        {SERIES.map((s) => (
                            <div
                                key={s.key}
                                className="flex items-center justify-between gap-4 py-0.5"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="h-[2px] w-3 rounded-full"
                                        style={{ backgroundColor: s.color }}
                                    />
                                    <span className="text-gray-400">{s.label}</span>
                                </div>
                                <span className="font-bold text-white">
                                    Rp{hovered[s.key].toLocaleString("id-ID")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TrendChart;
