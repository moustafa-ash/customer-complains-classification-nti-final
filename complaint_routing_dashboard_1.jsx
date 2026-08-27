import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  FileStack,
  Filter,
  Copy,
  Scissors,
  Phone,
  ShieldAlert,
  Cpu,
  SlidersHorizontal,
  Stamp,
  CircleCheck,
  TriangleAlert,
  ArrowRight,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */

const INK = {
  bg: "#0E1620",
  panel: "#141F2B",
  panelAlt: "#182534",
  line: "#28394A",
  lineFaint: "#1E2C3A",
  text: "#E7ECF1",
  muted: "#8CA0B0",
  mutedDim: "#5E7183",
};

const PALETTE = {
  credit_reporting: "#4F76A6",
  debt_collection: "#5FA0C4",
  mortgages_and_loans: "#2A9D8F",
  credit_card: "#E9C46A",
  retail_banking: "#E76F51",
};

const LABELS = {
  credit_reporting: "Credit Reporting",
  debt_collection: "Debt Collection",
  mortgages_and_loans: "Mortgages & Loans",
  credit_card: "Credit Card",
  retail_banking: "Retail Banking",
};

const CLASS_ORDER = [
  "credit_card",
  "credit_reporting",
  "debt_collection",
  "mortgages_and_loans",
  "retail_banking",
];

const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

const fmt = (n) => n.toLocaleString("en-US");

/* ---------------------------------------------------------------------- */
/* Data pulled directly from the four notebooks                          */
/* ---------------------------------------------------------------------- */

const PIPELINE = [
  { label: "Raw export", value: 162421, note: "complaints_processed.csv" },
  { label: "Drop missing narratives", value: 162411, note: "\u221210 rows" },
  { label: "Drop duplicate rows", value: 124676, note: "\u221237,735 rows" },
  { label: "Drop near-empty text (<10 chars)", value: 124620, note: "\u221256 rows" },
];

const VOLUME_RAW = [
  { key: "credit_reporting", value: 91179 },
  { key: "debt_collection", value: 23150 },
  { key: "mortgages_and_loans", value: 18990 },
  { key: "credit_card", value: 15566 },
  { key: "retail_banking", value: 13536 },
];
const VOLUME_TOTAL = VOLUME_RAW.reduce((s, d) => s + d.value, 0);

const INSIGHTS = [
  {
    no: "01",
    title: "Credit Reporting is the center of gravity",
    finding:
      "credit_reporting alone accounts for 45.2% of all cleaned complaints (56,276) \u2014 more than double the next-largest category, debt_collection, at 16.9%.",
    action: "Top priority for resource allocation.",
  },
  {
    no: "02",
    title: "Volume isn't complexity",
    finding:
      "mortgages_and_loans complaints run 118 words on average \u2014 the longest of any category \u2014 despite only 15% of total volume. credit_reporting complaints average just 74 words, the shortest, despite carrying 45% of volume.",
    action: "Fast triage for reporting; experienced specialists for mortgages.",
  },
  {
    no: "03",
    title: "Disputes drive Reporting & Collections",
    finding:
      "\u201cdispute\u201d appears in 30.8% of credit_reporting complaints and 24.3% of debt_collection complaints \u2014 far above other categories. \u201cidentity theft\u201d follows the same pattern (11.4% and 7.1%).",
    action: "Unify the two into one dispute-resolution workflow.",
  },
  {
    no: "04",
    title: "A phone-support gap",
    finding:
      "\u201ccalled\u201d / \u201ctold\u201d appear heavily in credit_card (37.7% / 33.0%), mortgages_and_loans (34.5% / 37.3%) and retail_banking (31.5% / 33.1%) \u2014 but almost never in credit_reporting (11.4%).",
    action: "Train call-center teams for three categories; fix systems, not people, for reporting.",
  },
  {
    no: "05",
    title: "One strategy per category, not one for all",
    finding:
      "Credit Reporting pairs huge volume with a high dispute rate and short text \u2192 automate. Mortgages & Loans pairs low volume with long, complex text \u2192 specialists. Debt Collection pairs moderate volume with a high dispute rate \u2192 compliance review.",
    action: "Tailored investment per department, not an even split.",
  },
];

const STRATEGY_CARDS = [
  {
    key: "credit_reporting",
    heading: "Automate & self-serve",
    body: "Huge volume, very short complaints, highest dispute rate. Built for automated triage and self-service dispute resolution.",
  },
  {
    key: "mortgages_and_loans",
    heading: "Specialist, high-touch",
    body: "Lowest volume but by far the longest, most complex complaints. Needs experienced case handlers, not a fast queue.",
  },
  {
    key: "debt_collection",
    heading: "Compliance review",
    body: "Moderate volume with a high dispute rate \u2014 signals collection-practice issues that need legal/compliance eyes.",
  },
];

const DISPUTE_KEYWORDS = [
  { category: "credit_reporting", dispute: 30.8, identity_theft: 11.4 },
  { category: "debt_collection", dispute: 24.3, identity_theft: 7.1 },
];

const CALL_TERMS = [
  { category: "credit_card", called: 37.7, told: 33.0 },
  { category: "mortgages_and_loans", called: 34.5, told: 37.3 },
  { category: "retail_banking", called: 31.5, told: 33.1 },
];

const MODELS = [
  {
    model: "Logistic Regression",
    accuracy: 86.0,
    macroF1: 84.0,
    dataset: "124,620 rows",
    tag: "baseline",
  },
  {
    model: "Logistic Regression (balanced)",
    accuracy: 84.0,
    macroF1: 83.0,
    dataset: "124,620 rows",
    tag: "classical",
  },
  {
    model: "LinearSVC (balanced)",
    accuracy: 85.0,
    macroF1: 83.0,
    dataset: "124,620 rows",
    tag: "production basis",
  },
  {
    model: "Multinomial Naive Bayes",
    accuracy: 82.0,
    macroF1: 80.0,
    dataset: "124,620 rows",
    tag: "classical",
  },
  {
    model: "Bidirectional LSTM",
    accuracy: 82.8,
    macroF1: 80.0,
    dataset: "56,784 rows",
    tag: "deep learning",
  },
];

const PER_CLASS_F1 = [
  { category: "credit_card", lr: 0.81, svc: 0.79, lstm: 0.76 },
  { category: "credit_reporting", lr: 0.89, svc: 0.89, lstm: 0.88 },
  { category: "debt_collection", lr: 0.79, svc: 0.79, lstm: 0.76 },
  { category: "mortgages_and_loans", lr: 0.86, svc: 0.85, lstm: 0.8 },
  { category: "retail_banking", lr: 0.87, svc: 0.86, lstm: 0.82 },
];

// Real predict_proba output from the calibrated LinearSVC, cell 6/7 of
// 02_model_training.ipynb. Order matches calibrated_svc.classes_.
const ROUTING_CASES = [
  {
    id: "Case 1",
    probs: {
      credit_card: 0.1127,
      credit_reporting: 0.0386,
      debt_collection: 0.0011,
      mortgages_and_loans: 0.0002,
      retail_banking: 0.8474,
    },
  },
  {
    id: "Case 2",
    probs: {
      credit_card: 0.0173,
      credit_reporting: 0.949,
      debt_collection: 0.0183,
      mortgages_and_loans: 0.0037,
      retail_banking: 0.0117,
    },
  },
  {
    id: "Case 3",
    probs: {
      credit_card: 0.0017,
      credit_reporting: 0.0561,
      debt_collection: 0.1287,
      mortgages_and_loans: 0.8135,
      retail_banking: 0.00002,
    },
  },
];

const SUMMARY_TABLE = [
  ["01", "Credit Reporting = 45% of all complaints", "Top priority for resource allocation"],
  [
    "02",
    "Mortgages complaints are longer & more complex despite lower volume",
    "Dedicated specialist team for complex cases",
  ],
  [
    "03",
    "Dispute / identity theft concentrated in Reporting & Collections",
    "Unified workflow to speed up dispute resolution",
  ],
  [
    "04",
    "Phone communication issues absent from Reporting, dominant elsewhere",
    "Train call-center teams rather than rebuild systems",
  ],
  [
    "05",
    "Each category needs a different strategy",
    "Tailored investment map per department",
  ],
];

/* ---------------------------------------------------------------------- */
/* Small building blocks                                                  */
/* ---------------------------------------------------------------------- */

function Eyebrow({ children }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
      style={{ color: INK.mutedDim }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ index, eyebrow, title, sub }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className="text-xs font-semibold px-2 py-1 border shrink-0"
        style={{ ...mono, color: INK.mutedDim, borderColor: INK.line }}
      >
        {index}
      </div>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-xl md:text-2xl font-semibold leading-snug" style={{ color: INK.text }}>
          {title}
        </h2>
        {sub && (
          <p className="text-sm mt-1 max-w-2xl" style={{ color: INK.muted }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Swatch({ ck }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
      style={{ backgroundColor: PALETTE[ck] }}
    />
  );
}

function CustomTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs border"
      style={{ background: INK.panelAlt, borderColor: INK.line, color: INK.text, ...mono }}
    >
      <div className="mb-1" style={{ color: INK.muted }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
          {suffix}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                              */
/* ---------------------------------------------------------------------- */

export default function Dashboard() {
  const [threshold, setThreshold] = useState(60);
  const [activeCase, setActiveCase] = useState(0);

  const currentCase = ROUTING_CASES[activeCase];

  const caseBars = useMemo(
    () =>
      CLASS_ORDER.map((k) => ({
        key: k,
        name: LABELS[k],
        value: Math.round(currentCase.probs[k] * 1000) / 10, // one decimal %
      })).sort((a, b) => b.value - a.value),
    [currentCase]
  );

  const topProb = Math.max(...Object.values(currentCase.probs)) * 100;
  const topClass = CLASS_ORDER.reduce((best, k) =>
    currentCase.probs[k] > currentCase.probs[best] ? k : best
  , CLASS_ORDER[0]);
  const routed = topProb >= threshold;

  const decisionCounts = useMemo(() => {
    let r = 0;
    ROUTING_CASES.forEach((c) => {
      const top = Math.max(...Object.values(c.probs)) * 100;
      if (top >= threshold) r += 1;
    });
    return { routed: r, escalated: ROUTING_CASES.length - r };
  }, [threshold]);

  return (
    <div style={{ background: INK.bg, color: INK.text, minHeight: "100%" }} className="w-full">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-10">
        {/* ---------------- HERO ---------------- */}
        <div className="mb-14">
          <Eyebrow>CFPB Consumer Narrative Classification &middot; Pipeline Review</Eyebrow>
          <h1
            className="text-3xl md:text-[2.65rem] font-semibold leading-[1.08] tracking-tight mb-4"
            style={{ maxWidth: "20ch" }}
          >
            Routing consumer complaints to the right desk, automatically.
          </h1>
          <p className="text-sm md:text-base max-w-2xl" style={{ color: INK.muted }}>
            A working file on four notebooks: cleaning 162,421 raw CFPB complaint
            narratives, reading five business insights out of them, and
            training / comparing five classifiers that route each complaint to
            one of five product desks &mdash; or flag it for human review.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-9" style={{ background: INK.line }}>
            {[
              ["124,620", "clean complaints"],
              ["5", "product categories"],
              ["86%", "top model accuracy"],
              ["60%", "routing confidence floor"],
            ].map(([v, l], i) => (
              <div key={i} className="p-4 md:p-5" style={{ background: INK.bg }}>
                <div className="text-2xl md:text-3xl font-semibold" style={mono}>
                  {v}
                </div>
                <div className="text-xs mt-1 uppercase tracking-wide" style={{ color: INK.mutedDim }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- PIPELINE ---------------- */}
        <div className="mb-16">
          <SectionHeading
            index="01"
            eyebrow="01_data_exploration.ipynb"
            title="From raw export to a modelable set"
            sub="Each step removes a specific kind of noise before anything gets vectorized."
          />
          <div className="flex flex-col md:flex-row md:items-stretch gap-2">
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step.label}>
                <div
                  className="flex-1 border p-4"
                  style={{ borderColor: INK.line, background: INK.panel }}
                >
                  <div className="flex items-center gap-2 mb-3" style={{ color: INK.mutedDim }}>
                    {i === 0 && <FileStack size={15} />}
                    {i === 1 && <Filter size={15} />}
                    {i === 2 && <Copy size={15} />}
                    {i === 3 && <Scissors size={15} />}
                    <span className="text-[11px] uppercase tracking-wide">{step.label}</span>
                  </div>
                  <div className="text-xl font-semibold" style={mono}>
                    {fmt(step.value)}
                  </div>
                  <div className="text-xs mt-1" style={{ color: INK.muted }}>
                    {step.note}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="hidden md:flex items-center justify-center" style={{ color: INK.mutedDim }}>
                    <ArrowRight size={16} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ---------------- VOLUME ---------------- */}
        <div className="mb-16">
          <SectionHeading
            index="02"
            eyebrow="Category volume &middot; raw dataset, 162,421 rows"
            title="Where the complaints actually come from"
          />
          <div className="border p-4 md:p-6" style={{ borderColor: INK.line, background: INK.panel }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={VOLUME_RAW}
                layout="vertical"
                margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={INK.lineFaint} horizontal={false} />
                <XAxis type="number" tick={{ fill: INK.mutedDim, fontSize: 11 }} axisLine={{ stroke: INK.line }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="key"
                  tickFormatter={(k) => LABELS[k]}
                  width={130}
                  tick={{ fill: INK.muted, fontSize: 12 }}
                  axisLine={{ stroke: INK.line }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: INK.lineFaint }}
                  content={(p) => (
                    <CustomTooltip
                      {...p}
                      label={p.label ? LABELS[p.label] : ""}
                      payload={p.payload?.map((pp) => ({ ...pp, name: "complaints" }))}
                    />
                  )}
                />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={26}>
                  {VOLUME_RAW.map((d) => (
                    <Cell key={d.key} fill={PALETTE[d.key]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v) => `${fmt(v)} (${((v / VOLUME_TOTAL) * 100).toFixed(1)}%)`}
                    style={{ fill: INK.muted, fontSize: 11, ...mono }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs mt-3" style={{ color: INK.mutedDim }}>
            After cleaning, this shifts a little \u2014 the EDA notebook finds credit_reporting
            settling at 45.2% of the final 124,620-row set and debt_collection at 16.9%.
          </p>
        </div>

        {/* ---------------- INSIGHTS ---------------- */}
        <div className="mb-16">
          <SectionHeading
            index="03"
            eyebrow="02_eda_business_insights_1.ipynb"
            title="Five things the text says about the business"
          />
          <div className="grid md:grid-cols-2 gap-3">
            {INSIGHTS.map((ins) => (
              <div
                key={ins.no}
                className="border p-4 md:p-5"
                style={{ borderColor: INK.line, background: INK.panel }}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-semibold" style={{ ...mono, color: INK.mutedDim }}>
                    {ins.no}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: INK.text }}>
                  {ins.title}
                </h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: INK.muted }}>
                  {ins.finding}
                </p>
                <div
                  className="text-xs pt-2 border-t flex items-start gap-1.5"
                  style={{ borderColor: INK.lineFaint, color: "#E9C46A" }}
                >
                  <ArrowRight size={13} className="shrink-0 mt-0.5" />
                  <span>{ins.action}</span>
                </div>
              </div>
            ))}

            {/* strategic map as the 6th cell, tying the 5 together */}
            <div
              className="border p-4 md:p-5 flex flex-col justify-between"
              style={{ borderColor: INK.line, background: INK.panelAlt }}
            >
              <div>
                <Eyebrow>Insight 05 &middot; in practice</Eyebrow>
                <h3 className="text-sm font-semibold mb-3">One map, three different plays</h3>
              </div>
              <div className="space-y-2">
                {STRATEGY_CARDS.map((s) => (
                  <div key={s.key} className="flex items-start gap-2 text-xs">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: PALETTE[s.key] }}
                    />
                    <div>
                      <span className="font-semibold" style={{ color: INK.text }}>
                        {LABELS[s.key]}
                      </span>{" "}
                      <span style={{ color: INK.muted }}>&mdash; {s.heading}.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- LANGUAGE SIGNALS ---------------- */}
        <div className="mb-16">
          <SectionHeading
            index="04"
            eyebrow="Keyword prevalence in the narrative text"
            title="What the words in a complaint already tell you"
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border p-4" style={{ borderColor: INK.line, background: INK.panel }}>
              <div className="flex items-center gap-2 mb-3" style={{ color: INK.mutedDim }}>
                <ShieldAlert size={15} />
                <span className="text-[11px] uppercase tracking-wide">
                  "dispute" &amp; "identity theft" mentions
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={DISPUTE_KEYWORDS} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={INK.lineFaint} vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickFormatter={(k) => LABELS[k]}
                    tick={{ fill: INK.muted, fontSize: 11 }}
                    axisLine={{ stroke: INK.line }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: INK.mutedDim, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip cursor={{ fill: INK.lineFaint }} content={(p) => <CustomTooltip {...p} suffix="%" />} />
                  <Bar dataKey="dispute" name="dispute" fill="#E76F51" radius={[3, 3, 0, 0]} barSize={22} />
                  <Bar dataKey="identity_theft" name="identity theft" fill="#E9C46A" radius={[3, 3, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border p-4" style={{ borderColor: INK.line, background: INK.panel }}>
              <div className="flex items-center gap-2 mb-3" style={{ color: INK.mutedDim }}>
                <Phone size={15} />
                <span className="text-[11px] uppercase tracking-wide">"called" &amp; "told" mentions</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={CALL_TERMS} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={INK.lineFaint} vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickFormatter={(k) => LABELS[k]}
                    tick={{ fill: INK.muted, fontSize: 11 }}
                    axisLine={{ stroke: INK.line }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: INK.mutedDim, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip cursor={{ fill: INK.lineFaint }} content={(p) => <CustomTooltip {...p} suffix="%" />} />
                  <Bar dataKey="called" name="called" fill="#5FA0C4" radius={[3, 3, 0, 0]} barSize={22} />
                  <Bar dataKey="told" name="told" fill="#2A9D8F" radius={[3, 3, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs mt-2" style={{ color: INK.mutedDim }}>
                credit_reporting sits far below all three at just 11.4% for "called" &mdash;
                its complaints trace back to data and process, not phone calls.
              </p>
            </div>
          </div>
        </div>

        {/* ---------------- MODELS ---------------- */}
        <div className="mb-16">
          <SectionHeading
            index="05"
            eyebrow="02_model_training.ipynb &middot; model_2.ipynb"
            title="Five classifiers, two very different recipes"
            sub="TF\u2011IDF (10k features, uni+bigrams) feeding classical models on the full 124,620-row set, versus a tokenized Bidirectional LSTM on a separately-cleaned 56,784-row sample."
          />
          <div className="border p-4 md:p-6 mb-4" style={{ borderColor: INK.line, background: INK.panel }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MODELS} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={INK.lineFaint} vertical={false} />
                <XAxis
                  dataKey="model"
                  tick={{ fill: INK.muted, fontSize: 10 }}
                  axisLine={{ stroke: INK.line }}
                  tickLine={false}
                  interval={0}
                  angle={-14}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: INK.mutedDim, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[70, 90]}
                />
                <Tooltip cursor={{ fill: INK.lineFaint }} content={(p) => <CustomTooltip {...p} suffix="%" />} />
                <Bar dataKey="accuracy" name="accuracy" fill="#5FA0C4" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar dataKey="macroF1" name="macro F1" fill="#E9C46A" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-6 text-xs">
            <div className="border p-3 flex items-start gap-2" style={{ borderColor: INK.line, background: INK.panelAlt }}>
              <Cpu size={14} className="mt-0.5 shrink-0" style={{ color: INK.mutedDim }} />
              <span style={{ color: INK.muted }}>
                Plain Logistic Regression edges out on raw accuracy (86%) because the
                classes are imbalanced and it leans into the majority class.
              </span>
            </div>
            <div className="border p-3 flex items-start gap-2" style={{ borderColor: INK.line, background: INK.panelAlt }}>
              <Cpu size={14} className="mt-0.5 shrink-0" style={{ color: INK.mutedDim }} />
              <span style={{ color: INK.muted }}>
                The deployed model is a <em>calibrated</em> LinearSVC (balanced) &mdash;
                same base estimator as the row above, wrapped so it can output the
                probabilities the routing console below needs.
              </span>
            </div>
            <div className="border p-3 flex items-start gap-2" style={{ borderColor: INK.line, background: INK.panelAlt }}>
              <Cpu size={14} className="mt-0.5 shrink-0" style={{ color: INK.mutedDim }} />
              <span style={{ color: INK.muted }}>
                The BiLSTM was trained on a smaller, separately-cleaned sample and
                stopped early at epoch 7 as validation loss climbed past epoch 2.
              </span>
            </div>
          </div>

          <div className="border overflow-x-auto" style={{ borderColor: INK.line }}>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: INK.panelAlt }}>
                  <th className="text-left p-3 font-semibold" style={{ color: INK.muted }}>
                    F1-score by category
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: "#5FA0C4" }}>
                    Logistic Reg.
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: "#E9C46A" }}>
                    LinearSVC (bal.)
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: "#2A9D8F" }}>
                    BiLSTM
                  </th>
                </tr>
              </thead>
              <tbody>
                {PER_CLASS_F1.map((row, i) => (
                  <tr key={row.category} style={{ borderTop: `1px solid ${INK.lineFaint}` }}>
                    <td className="p-3" style={{ color: INK.text }}>
                      <Swatch ck={row.category} />
                      {LABELS[row.category]}
                    </td>
                    <td className="p-3 text-right" style={mono}>
                      {row.lr.toFixed(2)}
                    </td>
                    <td className="p-3 text-right" style={mono}>
                      {row.svc.toFixed(2)}
                    </td>
                    <td className="p-3 text-right" style={mono}>
                      {row.lstm.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- ROUTING CONSOLE (signature) ---------------- */}
        <div className="mb-16">
          <SectionHeading
            index="06"
            eyebrow="Live logic from get_routing_decision()"
            title="The routing console"
            sub="Every incoming complaint gets a probability per desk from the calibrated model. Above the confidence floor, it's routed automatically. Below it, a human reviews."
          />

          <div className="border" style={{ borderColor: INK.line, background: INK.panel }}>
            <div className="grid md:grid-cols-[1fr_auto] gap-6 p-5 md:p-6 border-b" style={{ borderColor: INK.lineFaint }}>
              {/* case selector */}
              <div>
                <div className="flex gap-2 mb-5">
                  {ROUTING_CASES.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCase(i)}
                      className="text-xs px-3 py-1.5 border transition-colors"
                      style={{
                        borderColor: i === activeCase ? "#E9C46A" : INK.line,
                        color: i === activeCase ? "#E9C46A" : INK.muted,
                        background: i === activeCase ? "rgba(233,196,106,0.08)" : "transparent",
                      }}
                    >
                      {c.id}
                    </button>
                  ))}
                  <span className="text-xs self-center ml-1" style={{ color: INK.mutedDim }}>
                    real predict_proba() output, 02_model_training.ipynb
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={caseBars} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={INK.lineFaint} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: INK.mutedDim, fontSize: 11 }} axisLine={{ stroke: INK.line }} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="name" width={124} tick={{ fill: INK.muted, fontSize: 12 }} axisLine={{ stroke: INK.line }} tickLine={false} />
                    <ReferenceLine x={threshold} stroke="#E9C46A" strokeDasharray="4 3" strokeWidth={1.5} />
                    <Tooltip cursor={{ fill: INK.lineFaint }} content={(p) => <CustomTooltip {...p} suffix="%" />} />
                    <Bar dataKey="value" name="confidence" radius={[0, 3, 3, 0]} barSize={22}>
                      {caseBars.map((d) => (
                        <Cell key={d.key} fill={PALETTE[d.key]} fillOpacity={d.value === Math.max(...caseBars.map((x) => x.value)) ? 1 : 0.45} />
                      ))}
                      <LabelList dataKey="value" position="right" formatter={(v) => `${v}%`} style={{ fill: INK.muted, fontSize: 11, ...mono }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* decision stamp */}
              <div className="flex flex-col items-center justify-center gap-3 md:w-48 pt-2 md:pt-0">
                <div
                  className="w-full border-2 p-4 flex flex-col items-center gap-2 text-center"
                  style={{
                    borderColor: routed ? "#2A9D8F" : "#E76F51",
                    background: routed ? "rgba(42,157,143,0.08)" : "rgba(231,111,81,0.08)",
                  }}
                >
                  {routed ? (
                    <CircleCheck size={26} color="#2A9D8F" />
                  ) : (
                    <TriangleAlert size={26} color="#E76F51" />
                  )}
                  <div className="text-xs uppercase tracking-wide" style={{ color: INK.mutedDim }}>
                    {routed ? "Routed to" : "Escalated"}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: routed ? "#2A9D8F" : "#E76F51" }}>
                    {routed ? LABELS[topClass] : "Other Problem \u2014 human review"}
                  </div>
                  <div className="text-xs" style={mono}>
                    top confidence {topProb.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* threshold slider */}
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3" style={{ color: INK.mutedDim }}>
                <SlidersHorizontal size={15} />
                <span className="text-[11px] uppercase tracking-wide">Routing confidence floor</span>
                <span className="ml-auto text-sm font-semibold" style={{ ...mono, color: "#E9C46A" }}>
                  {threshold}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "#E9C46A" }}
              />
              <div className="flex justify-between text-xs mt-4" style={{ color: INK.muted }}>
                <span>
                  At {threshold}%, {decisionCounts.routed} of {ROUTING_CASES.length} sample
                  cases route automatically; {decisionCounts.escalated} would go to a human.
                </span>
                <span className="flex items-center gap-1" style={{ color: INK.mutedDim }}>
                  <Stamp size={13} /> notebook default: 60%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- FOOTER SUMMARY ---------------- */}
        <div>
          <SectionHeading index="07" eyebrow="Executive summary" title="The five recommendations, in one place" />
          <div className="border overflow-x-auto" style={{ borderColor: INK.line }}>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {SUMMARY_TABLE.map((row, i) => (
                  <tr key={row[0]} style={{ borderTop: i ? `1px solid ${INK.lineFaint}` : "none" }}>
                    <td className="p-3 align-top" style={{ ...mono, color: INK.mutedDim, width: 32 }}>
                      {row[0]}
                    </td>
                    <td className="p-3 align-top" style={{ color: INK.text, width: "45%" }}>
                      {row[1]}
                    </td>
                    <td className="p-3 align-top" style={{ color: "#E9C46A" }}>
                      {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-6 pb-4" style={{ color: INK.mutedDim }}>
            Sourced from 01_data_exploration.ipynb, 02_eda_business_insights_1.ipynb,
            02_model_training.ipynb and model_2.ipynb.
          </p>
        </div>
      </div>
    </div>
  );
}
