"use client";

import { useRef, useEffect, useState, useActionState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import { joinWaitlist } from "./actions";
import {
  SiSalesforce,
  SiTrello,
  SiStripe,
  SiGoogleanalytics,
  SiZendesk,
  SiNotion,
  SiGmail,
  SiSlack,
} from "react-icons/si";

/* ============================================
   MAIN PAGE
   ============================================ */

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div className="section-divider" />
        <ProblemSection />
        <TransformSection />
        <ProcessSection />
        <div className="section-divider" />
        <QASection />
        <div className="section-divider" />
        <FlywheelSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

/* ============================================
   NAVIGATION
   ============================================ */

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`nav${scrolled ? " nav-scrolled" : ""}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <a href="#" className="nav-logo">
        fitted.
      </a>
      <div className="nav-links">
        <a href="#process" className="nav-link">
          Process
        </a>
        <a href="#model" className="nav-link">
          Why Us
        </a>
        <a href="#contact" className="nav-cta">
          Get a Quote
        </a>
      </div>
    </motion.nav>
  );
}

/* ============================================
   HERO
   ============================================ */

const ease = [0.16, 1, 0.3, 1] as const;

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <motion.h1
          className="hero-headline"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease }}
        >
          Software,
          <br />
          <em>fitted.</em>
        </motion.h1>
        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
        >
          <a href="#contact" className="btn-primary">
            Get a Quote
          </a>
          <a href="#process" className="btn-secondary">
            See How It Works &rarr;
          </a>
        </motion.div>
      </div>
      <DashboardMock />
    </section>
  );
}

/* ============================================
   DASHBOARD MOCK
   ============================================ */

function DashIconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}

function DashIconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="4.5" r="2.5" fill="currentColor" />
      <path d="M2 12c0-2.5 2.2-4 5-4s5 1.5 5 4" fill="currentColor" />
    </svg>
  );
}

function DashIconTasks() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="6" width="9" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="10" width="7" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function DashIconChart() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="8" width="3" height="5" rx="0.5" fill="currentColor" />
      <rect x="5.5" y="4" width="3" height="9" rx="0.5" fill="currentColor" />
      <rect x="10" y="1" width="3" height="12" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function DashIconInvoice() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="1" width="10" height="12" rx="1.5" fill="currentColor" />
      <rect x="4" y="4" width="6" height="1" rx="0.5" fill="var(--bg-elevated)" />
      <rect x="4" y="6.5" width="4" height="1" rx="0.5" fill="var(--bg-elevated)" />
      <rect x="4" y="9" width="5" height="1" rx="0.5" fill="var(--bg-elevated)" />
    </svg>
  );
}

function AreaChartSVG() {
  return (
    <svg viewBox="0 0 240 100" width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      <line x1="0" y1="25" x2="240" y2="25" stroke="var(--border)" strokeWidth="0.5" />
      <line x1="0" y1="50" x2="240" y2="50" stroke="var(--border)" strokeWidth="0.5" />
      <line x1="0" y1="75" x2="240" y2="75" stroke="var(--border)" strokeWidth="0.5" />
      {/* Filled area */}
      <path
        d="M0,80 C20,75 40,60 60,55 C80,50 100,58 120,45 C140,32 160,38 180,28 C200,18 220,22 240,15 L240,100 L0,100 Z"
        fill="url(#chartGrad)"
      />
      {/* Line */}
      <path
        d="M0,80 C20,75 40,60 60,55 C80,50 100,58 120,45 C140,32 160,38 180,28 C200,18 220,22 240,15"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
      {/* Glow dot at latest point */}
      <circle cx="240" cy="15" r="3" fill="var(--accent)" />
      <circle cx="240" cy="15" r="6" fill="var(--accent)" opacity="0.25" />
    </svg>
  );
}

const ACTIVITY_ITEMS = [
  { color: "#5EC69A", text: "New client onboarded \u2014 Acme Corp", time: "2m ago" },
  { color: "#5B8DEF", text: "Invoice #1042 paid \u2014 $4,200", time: "18m ago" },
  { color: "#C97BDB", text: "Project milestone completed", time: "1h ago" },
  { color: "#F0C75E", text: "Support ticket resolved #847", time: "2h ago" },
  { color: "#E87D5F", text: "Weekly report generated", time: "5h ago" },
];

function DashboardMock() {
  return (
    <motion.div
      className="dashboard-mock"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.9, ease }}
    >
      <div className="dash-window">
        {/* Chrome */}
        <div className="dash-chrome">
          <div className="dash-dots">
            <span className="dash-dot" />
            <span className="dash-dot" />
            <span className="dash-dot" />
          </div>
          <span className="dash-chrome-title">Fitted Platform</span>
          <button className="dash-chrome-btn">+ Add Feature</button>
        </div>

        <div className="dash-body">
          {/* Sidebar */}
          <div className="dash-sidebar">
            <div className="dash-nav-item active"><DashIconGrid /> Dashboard</div>
            <div className="dash-nav-item"><DashIconUsers /> Clients</div>
            <div className="dash-nav-item"><DashIconTasks /> Projects</div>
            <div className="dash-nav-item"><DashIconChart /> Analytics</div>
            <div className="dash-nav-item"><DashIconInvoice /> Invoicing</div>
          </div>

          {/* Main Content */}
          <div className="dash-main">
            {/* KPI Cards */}
            <div className="dash-kpis">
              <div className="dash-kpi">
                <span className="dash-kpi-label">Revenue</span>
                <span className="dash-kpi-value">$48.2K</span>
                <span className="dash-kpi-change positive">+12.4%</span>
              </div>
              <div className="dash-kpi">
                <span className="dash-kpi-label">Active Clients</span>
                <span className="dash-kpi-value">24</span>
                <span className="dash-kpi-change positive">+3</span>
              </div>
              <div className="dash-kpi">
                <span className="dash-kpi-label">Tasks Done</span>
                <span className="dash-kpi-value">142</span>
                <span className="dash-kpi-change positive">+18%</span>
              </div>
              <div className="dash-kpi">
                <span className="dash-kpi-label">Avg. Response</span>
                <span className="dash-kpi-value">1.2h</span>
                <span className="dash-kpi-change negative">-8%</span>
              </div>
            </div>

            {/* Two-column content */}
            <div className="dash-columns">
              <div className="dash-chart-card">
                <div className="dash-chart-title">Revenue Overview</div>
                <AreaChartSVG />
              </div>
              <div className="dash-activity-card">
                <div className="dash-activity-title">Recent Activity</div>
                {ACTIVITY_ITEMS.map((item) => (
                  <div key={item.text} className="dash-activity-item">
                    <span className="dash-activity-dot" style={{ background: item.color }} />
                    <span className="dash-activity-text">{item.text}</span>
                    <span className="dash-activity-time">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================
   PROBLEM SECTION
   ============================================ */

function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section className="problem" ref={ref}>
      <motion.span
        className="section-label"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        The Problem
      </motion.span>
      <motion.h2
        className="section-headline"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease }}
      >
        You&rsquo;re paying for dozens of tools
        <br />
        and using <em>half</em> of each.
      </motion.h2>
      <div className="stats-row">
        <AnimatedStat
          value={185}
          prefix="$"
          suffix="K"
          label="Average annual SaaS spend for a 50-person agency"
          parentInView={isInView}
          delay={0.3}
        />
        <AnimatedStat
          value={51}
          suffix="%"
          label="of martech capabilities go unused"
          parentInView={isInView}
          delay={0.5}
        />
        <AnimatedStat
          value={44}
          label="SaaS tools per company this size"
          parentInView={isInView}
          delay={0.7}
        />
      </div>
      <div className="stats-row stats-row-second">
        <AnimatedStat
          value={5}
          suffix=" weeks"
          label="Lost per employee per year to app-switching"
          parentInView={isInView}
          delay={0.9}
        />
        <AnimatedStat
          value={30}
          suffix="%"
          label="of your SaaS spend is redundant or overlapping"
          parentInView={isInView}
          delay={1.1}
        />
        <AnimatedStat
          value={50}
          prefix="~"
          suffix="%"
          label="annual churn rate on marketing tools"
          parentInView={isInView}
          delay={1.3}
        />
      </div>
    </section>
  );
}

function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
  label,
  parentInView,
  delay,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  parentInView: boolean;
  delay: number;
}) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (parentInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const duration = 2000;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start - delay * 1000;
        if (elapsed < 0) {
          requestAnimationFrame(step);
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [parentInView, value, delay]);

  return (
    <motion.div
      className="stat"
      initial={{ opacity: 0, y: 16 }}
      animate={parentInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      <span className="stat-value">
        {prefix}
        {display}
        {suffix}
      </span>
      <span className="stat-label">{label}</span>
    </motion.div>
  );
}

/* ============================================
   SCROLL TRANSFORMATION SECTION
   ============================================ */

const TOOLS = [
  { name: "CRM", x: -30, y: -24, rotate: -10, color: "#5B8DEF" },
  { name: "Project Mgmt", x: 26, y: -28, rotate: 7, color: "#E87D5F" },
  { name: "Invoicing", x: -34, y: 8, rotate: -4, color: "#5EC69A" },
  { name: "Analytics", x: 30, y: 22, rotate: 14, color: "#C97BDB" },
  { name: "Support", x: -22, y: 28, rotate: -16, color: "#F0C75E" },
  { name: "Documentation", x: 18, y: -10, rotate: 9, color: "#7BAFDB" },
  { name: "Email", x: -10, y: -34, rotate: -6, color: "#DB7B8A" },
  { name: "Communication", x: 34, y: -4, rotate: 18, color: "#8ADB7B" },
];

const TOOL_ICONS: Record<string, React.ReactNode> = {
  CRM: <SiSalesforce size={26} color="#5B8DEF" />,
  "Project Mgmt": <SiTrello size={26} color="#E87D5F" />,
  Invoicing: <SiStripe size={26} color="#5EC69A" />,
  Analytics: <SiGoogleanalytics size={26} color="#C97BDB" />,
  Support: <SiZendesk size={26} color="#F0C75E" />,
  Documentation: <SiNotion size={26} color="#7BAFDB" />,
  Email: <SiGmail size={26} color="#DB7B8A" />,
  Communication: <SiSlack size={26} color="#8ADB7B" />,
};

function TransformSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Phase 1 (0.00\u20130.18): Tools scatter in + "Your current stack"
  const h1Opacity = useTransform(
    scrollYProgress,
    [0, 0.02, 0.09, 0.12],
    [0, 1, 1, 0]
  );
  // Phase 2 (0.18\u20130.36): Tools converge (no headline)
  // Phase 3 (0.36\u20130.44): Tools fade out
  // Phase 4 (0.46\u20130.60): "What if it was just\u2026" alone on screen
  const h2Opacity = useTransform(
    scrollYProgress,
    [0.32, 0.35, 0.39, 0.42],
    [0, 1, 1, 0]
  );
  // Phase 5 (0.66\u20130.78): Platform card appears
  const platformOpacity = useTransform(
    scrollYProgress,
    [0.46, 0.52],
    [0, 1]
  );
  const platformScale = useTransform(
    scrollYProgress,
    [0.46, 0.54],
    [0.88, 1]
  );
  // Phase 6 (0.78\u20131.0): "One platform. Yours." above the card
  const h3Opacity = useTransform(
    scrollYProgress,
    [0.54, 0.60],
    [0, 1]
  );

  return (
    <section className="transform-section" ref={containerRef}>
      <div className="transform-sticky">
        <motion.h2
          className="transform-headline"
          style={{ opacity: h1Opacity }}
        >
          Your current stack
        </motion.h2>
        <motion.h2
          className="transform-headline"
          style={{ opacity: h2Opacity }}
        >
          What if it was just&hellip;
        </motion.h2>
        <motion.h2
          className="transform-headline"
          style={{ opacity: h3Opacity, y: -200 }}
        >
          One platform. <em>Yours.</em>
        </motion.h2>

        {TOOLS.map((tool, i) => (
          <ToolCard
            key={tool.name}
            tool={tool}
            index={i}
            scrollProgress={scrollYProgress}
          />
        ))}

        <motion.div
          className="platform-card"
          style={{
            opacity: platformOpacity,
            scale: platformScale,
            y: 40,
          }}
        >
          <div className="platform-header">
            <span className="platform-icon" />
            <span className="platform-title">Your Fitted Platform</span>
          </div>
          <div className="platform-body">
            <div className="platform-module">Clients &amp; Pipeline</div>
            <div className="platform-module">Projects &amp; Tasks</div>
            <div className="platform-module">Invoicing &amp; Payments</div>
            <div className="platform-module">Reports &amp; Analytics</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ToolCard({
  tool,
  index,
  scrollProgress,
}: {
  tool: (typeof TOOLS)[number];
  index: number;
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // Scattered during phase 1, converge during phase 2
  const x = useTransform(
    scrollProgress,
    [0, 0.03, 0.12, 0.24],
    [`${tool.x}vw`, `${tool.x}vw`, `${tool.x * 0.12}vw`, "0vw"]
  );
  const y = useTransform(
    scrollProgress,
    [0, 0.03, 0.12, 0.24],
    [`${tool.y}vh`, `${tool.y}vh`, `${tool.y * 0.12}vh`, "0vh"]
  );
  const rotate = useTransform(
    scrollProgress,
    [0, 0.12, 0.24],
    [tool.rotate, tool.rotate * 0.3, 0]
  );
  // Appear staggered in phase 1, fully gone by 0.30 (before h2 at 0.32)
  const opacity = useTransform(
    scrollProgress,
    [0, 0.015 + index * 0.006, 0.24, 0.30],
    [0, 1, 1, 0]
  );
  const scale = useTransform(
    scrollProgress,
    [0.24, 0.30],
    [1, 0.5]
  );

  return (
    <motion.div
      className="tool-card"
      style={{ x, y, rotate, opacity, scale }}
    >
      {TOOL_ICONS[tool.name]}
    </motion.div>
  );
}

/* ============================================
   PROCESS SECTION
   ============================================ */

const STEPS = [
  {
    number: "01",
    title: "Strip Down",
    description:
      "We identify the bare bones of what your business actually needs. No bloat, no unused features \u2014 just the essentials that move the needle.",
  },
  {
    number: "02",
    title: "Ship It",
    description:
      "You get a clean, functional platform built around those core needs. Nothing more, nothing less. Every feature earns its place.",
  },
  {
    number: "03",
    title: "You Shape It",
    description:
      "Need something new? Tell the AI on your dashboard. It writes the code, ships the change, and your platform evolves to fit you \u2014 so you use 100% of it.",
  },
];

function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section className="process" id="process" ref={ref}>
      <motion.span
        className="section-label"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        The Process
      </motion.span>
      <motion.h2
        className="section-headline"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease }}
      >
        Less software.
        <br />
        <em>More yours.</em>
      </motion.h2>
      <div className="process-steps">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            className="process-step"
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 + i * 0.15, ease }}
          >
            <span className="step-number">{step.number}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================
   QUALITY ASSURANCE SECTION
   ============================================ */

const QA_TIERS = [
  {
    label: "Simple Requests",
    title: "AI-Reviewed",
    description:
      "Straightforward changes \u2014 copy updates, layout tweaks, new fields \u2014 are written and reviewed by AI automatically. Deployed in minutes, not days.",
    icon: "auto",
  },
  {
    label: "Advanced Requests",
    title: "Human-Reviewed",
    description:
      "Complex features, integrations, and architectural changes are always reviewed by a human engineer before shipping. No exceptions.",
    icon: "human",
  },
];

function QASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section className="qa" ref={ref}>
      <motion.span
        className="section-label"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        Quality Assurance
      </motion.span>
      <motion.h2
        className="section-headline"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease }}
      >
        Every change is checked.
        <br />
        <em>Every time.</em>
      </motion.h2>
      <div className="qa-grid">
        {QA_TIERS.map((tier, i) => (
          <motion.div
            key={tier.title}
            className="qa-card"
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.15, ease }}
          >
            <span className="qa-tier-label">{tier.label}</span>
            <div className="qa-icon-row">
              {tier.icon === "auto" ? (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="12" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
                  <path d="M9 14.5l3 3 7-7" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="10" r="4.5" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
                  <path d="M6 24c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              )}
            </div>
            <h3 className="qa-card-title">{tier.title}</h3>
            <p className="qa-card-desc">{tier.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================
   FLYWHEEL SECTION
   ============================================ */

const FLYWHEEL_ITEMS = [
  {
    title: "Reusable Components",
    desc: "Every feature we build becomes a building block for the next client. Your investment compounds.",
  },
  {
    title: "Vertical Expertise",
    desc: "Deep knowledge in your industry, transferred and refined across every project we deliver.",
  },
  {
    title: "AI That Learns",
    desc: "Our tooling improves with every build, every bug, every solution. The library of solved problems grows daily.",
  },
  {
    title: "Faster, Cheaper, Better",
    desc: "What took months now takes weeks. What took weeks takes days. Each client benefits from every client before them.",
  },
];

function FlywheelSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section className="flywheel" id="model" ref={ref}>
      <motion.span
        className="section-label"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        The Model
      </motion.span>
      <motion.h2
        className="section-headline"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease }}
      >
        Every client makes
        <br />
        the next one <em>faster.</em>
      </motion.h2>
      <div className="flywheel-grid">
        {FLYWHEEL_ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            className="flywheel-card"
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease }}
          >
            <span className="flywheel-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================
   CTA SECTION
   ============================================ */

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });
  const [state, formAction, pending] = useActionState(joinWaitlist, null);

  return (
    <section className="cta" id="contact" ref={ref}>
      <div className="cta-inner">
        <div className="cta-left">
          <motion.h2
            className="cta-headline"
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease }}
          >
            Your agency wastes $50K+ a year
            <br />
            on software. <em>Let&rsquo;s fix that.</em>
          </motion.h2>
          <motion.p
            className="cta-sub"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Book a free audit. We&rsquo;ll map every tool, cut the waste,
            and build what actually fits.
          </motion.p>
        </div>
        <motion.div
          className="cta-right"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          {state?.success ? (
            <div className="cta-form cta-success">
              <span className="cta-success-icon">&#10003;</span>
              <p className="cta-success-text">We&rsquo;ll be in touch!</p>
              <p className="cta-fine">Expect a reply within 24 hours.</p>
            </div>
          ) : (
            <>
              <form className="cta-form" action={formAction}>
                <input
                  type="email"
                  name="email"
                  className="cta-input"
                  placeholder="your@email.com"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary cta-submit"
                  disabled={pending}
                >
                  {pending ? "Sending..." : "Get a Quote"}
                </button>
                {state?.message && !state.success && (
                  <p className="cta-error">{state.message}</p>
                )}
              </form>
              <p className="cta-fine">Free quote. No commitment.</p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================
   FOOTER
   ============================================ */

function Footer() {
  return (
    <footer className="footer">
      <span className="footer-logo">fitted.</span>
      <span className="footer-text">
        Custom software for the AI era.
      </span>
    </footer>
  );
}
