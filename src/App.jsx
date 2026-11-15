
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Users,
  FolderOpen,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Zap,
  Globe,
  ChevronRight,
} from "lucide-react";
import "./App.css";

const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Manage all your clients, their details and business records from one organized workspace.",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description: "Upload, organize and securely share important documents with your clients.",
  },
  {
    icon: ClipboardList,
    title: "Tasks & Deadlines",
    description: "Assign work to your team, track progress and never miss an important deadline.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Workspaces",
    description: "Keep business data private with role-based access and secure workspaces.",
  },
  {
    icon: BarChart3,
    title: "Business Insights",
    description: "Understand your team's work and business performance through clear reports.",
  },
  {
    icon: Zap,
    title: "Team Collaboration",
    description: "Bring business owners and employees together in one connected platform.",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="website">
      <header className="navbar">
        <a href="#" className="brand" onClick={closeMenu}>
          <span className="brand-icon">C</span>
          <span>Client<span className="brand-highlight">Desk</span></span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
          <a href="/login" className="nav-login" onClick={closeMenu}>Log in</a>
          <a href="/signup" className="nav-button" onClick={closeMenu}>
            Get Started <ArrowRight size={16} />
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="announcement">
              <span className="announcement-dot"></span>
              A smarter way to manage your business
              <ChevronRight size={15} />
            </div>

            <h1>
              Your business.
              <br />
              Your clients.
              <br />
              <span>One workspace.</span>
            </h1>

            <p className="hero-description">
              Manage clients, organize documents, assign tasks and
              collaborate with your team — all from one simple,
              secure and powerful platform.
            </p>

            <div className="hero-actions">
              <a href="/signup" className="primary-button">
                Start for free <ArrowRight size={18} />
              </a>
              <a href="#features" className="secondary-button">
                Explore features
              </a>
            </div>

            <div className="hero-trust">
              <ShieldCheck size={17} />
              Built for professional service businesses
            </div>
          </div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="dashboard-window">
              <div className="window-top">
                <div className="window-dots">
                  <i></i><i></i><i></i>
                </div>
                <span>clientdesk.app</span>
                <div className="window-avatar">JD</div>
              </div>

              <div className="mock-dashboard">
                <aside className="mock-sidebar">
                  <div className="mock-logo">C</div>
                  <div className="mock-side-item active">▦</div>
                  <div className="mock-side-item">♧</div>
                  <div className="mock-side-item">▤</div>
                  <div className="mock-side-item">◷</div>
                  <div className="mock-side-item">⚙</div>
                </aside>

                <div className="mock-main">
                  <div className="mock-heading">
                    <div>
                      <small>MONDAY, NOVEMBER 2026</small>
                      <h3>Good morning, John 👋</h3>
                      <p>Here's what's happening with your business.</p>
                    </div>
                    <div className="mock-notification">♧</div>
                  </div>

                  <div className="mock-stats">
                    <div className="mock-stat">
                      <span>Total Clients</span>
                      <strong>248</strong>
                      <small>↗ 12% this month</small>
                    </div>
                    <div className="mock-stat">
                      <span>Active Tasks</span>
                      <strong>36</strong>
                      <small>↗ 8 new tasks</small>
                    </div>
                    <div className="mock-stat">
                      <span>Documents</span>
                      <strong>1,284</strong>
                      <small>↗ 24 added</small>
                    </div>
                  </div>

                  <div className="mock-table">
                    <div className="mock-table-head">
                      <strong>Recent Clients</strong>
                      <span>View all →</span>
                    </div>
                    {[
                      ["AS", "Acme Solutions", "Active"],
                      ["GP", "Global Partners", "Pending"],
                      ["TC", "TechCraft Pvt. Ltd.", "Active"],
                    ].map((client) => (
                      <div className="mock-client" key={client[0]}>
                        <div className="mock-client-avatar">{client[0]}</div>
                        <span>{client[1]}</span>
                        <small className={client[2] === "Active" ? "status-active" : "status-pending"}>
                          {client[2]}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="floating-card">
              <span className="floating-check"><CheckCircle2 size={20} /></span>
              <div>
                <strong>Everything organized</strong>
                <small>Your workspace is up to date</small>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="trust-section">
          <p>ONE WORKSPACE FOR EVERY PROFESSIONAL BUSINESS</p>
          <div className="trust-items">
            <span><ShieldCheck /> CA & Accounting Firms</span>
            <span><Globe /> Consulting Businesses</span>
            <span><Users /> Law Firms</span>
            <span><FolderOpen /> Professional Services</span>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">POWERFUL FEATURES</span>
            <h2>Everything your business needs.<br /><span>Nothing you don't.</span></h2>
            <p>Stop switching between different tools. Bring your entire client workflow together.</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  className="feature-card"
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                >
                  <div className="feature-icon"><Icon size={23} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <a href="#get-started">Learn more <ArrowRight size={15} /></a>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">GET STARTED IN MINUTES</span>
            <h2>Simple setup.<br /><span>Powerful possibilities.</span></h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span>01</span>
              <h3>Create your workspace</h3>
              <p>Register your business and set up your own secure workspace.</p>
            </div>
            <div className="step-card">
              <span>02</span>
              <h3>Bring your team onboard</h3>
              <p>Invite employees and organize your clients in one place.</p>
            </div>
            <div className="step-card">
              <span>03</span>
              <h3>Manage everything</h3>
              <p>Track tasks, share documents and serve clients efficiently.</p>
            </div>
          </div>
        </section>

        <section className="cta-section" id="get-started">
          <div>
            <span className="eyebrow">YOUR WORKSPACE STARTS HERE</span>
            <h2>Ready to work smarter?</h2>
            <p>Bring your clients, team and daily work together with ClientDesk.</p>
          </div>
          <a href="/signup" className="primary-button">
            Get started <ArrowRight size={18} />
          </a>
        </section>
      </main>

      <footer className="footer" id="about">
        <a href="#" className="brand">
          <span className="brand-icon">C</span>
          <span>Client<span className="brand-highlight">Desk</span></span>
        </a>
        <p>One workspace. Better business.</p>
        <span id="contact">© 2026 ClientDesk. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default App;
