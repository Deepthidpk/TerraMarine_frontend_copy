import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Waves, 
  ShieldCheck, 
  Globe, 
  Fish, 
  Users, 
  ArrowRight, 
  Compass, 
  Anchor, 
  Sparkles,
  Heart,
  CheckCircle2
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoin = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-root">
      {/* HERO SECTION - EXACT MATCH TO SPECIFIED DESIGN */}
      <section className="hero-container" id="hero">
        {/* Floating Capsule Glassmorphism Navbar */}
        <header className="hero-navbar-capsule">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="brand-icon-wrapper">
              <Waves size={22} className="brand-icon" />
            </div>
          </div>

          <nav className="nav-menu-links">
            <button onClick={() => scrollToSection('about')} className="nav-link-btn">
              <span className="dash">-</span> About
            </button>
            <button onClick={() => scrollToSection('ecosystem')} className="nav-link-btn">
              <span className="dash">-</span> Ecosystem
            </button>
            <button onClick={() => scrollToSection('features')} className="nav-link-btn">
              <span className="dash">-</span> Features
            </button>
            <button onClick={() => scrollToSection('partners')} className="nav-link-btn">
              <span className="dash">-</span> Partners
            </button>
          </nav>

          <div className="nav-auth-actions">
            <button onClick={() => navigate(user ? '/dashboard' : '/login')} className="nav-action-btn">
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Center Text Content */}
        <div className="hero-center-content">
          <span className="hero-script-tag">Welcome</span>

          <h1 className="hero-title-main">
            TERRAMARINE
          </h1>
          
          <p className="hero-subtitle">
            "Empowering real-time marine intelligence, pollution response, and coastal action worldwide."
          </p>

          <button className="hero-join-btn" onClick={handleJoin}>
            Join Now
          </button>
        </div>

        {/* Bottom Shore Soft Fade Gradient */}
        <div className="hero-bottom-fade"></div>
      </section>

      {/* ABOUT SECTION */}
      <section className="landing-section about-section" id="about">
        <div className="section-container">
          <div className="section-header center">
            <div className="badge-pill">
              <Sparkles size={14} /> Our Mission
            </div>
            <h2 className="section-title">Pioneering Ocean & Shoreline Conservation</h2>
            <p className="section-description">
              TerraMarine connects volunteers, coastal communities, marine scientists, and environmental organizations to protect marine life, restore shorelines, and mitigate coastal pollution through real-time intelligence.
            </p>
          </div>

          <div className="stats-ticker-grid">
            <div className="stat-box">
              <div className="stat-icon-bg">
                <Waves size={26} />
              </div>
              <div className="stat-number">18,500+</div>
              <div className="stat-label">KG Ocean Plastic Collected</div>
              <img src="/images/cyan_coral_corner_clean.png" alt="" className="card-artwork-blend" />
            </div>

            <div className="stat-box">
              <div className="stat-icon-bg">
                <Users size={26} />
              </div>
              <div className="stat-number">3,400+</div>
              <div className="stat-label">Active Coastal Volunteers</div>
              <img src="/images/cyan_marine_cleanups_bg.png" alt="" className="card-artwork-blend" />
            </div>

            <div className="stat-box">
              <div className="stat-icon-bg">
                <Fish size={26} />
              </div>
              <div className="stat-number">420+</div>
              <div className="stat-label">Marine Species Tracked</div>
              <img src="/images/cyan_fish_coral_bg.png" alt="" className="card-artwork-blend" />
            </div>

            <div className="stat-box">
              <div className="stat-icon-bg">
                <Globe size={26} />
              </div>
              <div className="stat-number">120+</div>
              <div className="stat-label">Protected Coastline Miles</div>
              <img src="/images/purple_coral_card_bg.png" alt="" className="card-artwork-blend" />
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM SECTION */}
      <section className="landing-section ecosystem-section" id="ecosystem">
        <div className="section-container">
          <div className="section-header center">
            <div className="badge-pill">
              <Compass size={14} /> Comprehensive Platform
            </div>
            <h2 className="section-title">The TerraMarine Ecosystem</h2>
            <p className="section-description">
              An end-to-end framework built for action, monitoring, community engagement, and data-driven ecological restoration.
            </p>
          </div>

          <div className="ecosystem-cards-grid">
            <div className="eco-card">
              <div className="eco-card-header">
                <div className="eco-icon-wrapper">
                  <Anchor size={24} />
                </div>
                <h3>Coastal Cleanup Campaigns</h3>
              </div>
              <p>
                Mobilize beach cleanups with live GPS check-ins and debris analytics.
              </p>
              <ul className="eco-list">
                <li><CheckCircle2 size={16} /> Live GPS map locations</li>
                <li><CheckCircle2 size={16} /> Volunteer reward badges</li>
                <li><CheckCircle2 size={16} /> Debris weigh-in analytics</li>
              </ul>
              <img src="/images/cyan_cleanups_corner.png" alt="" className="card-artwork-blend" />
            </div>

            <div className="eco-card">
              <div className="eco-card-header">
                <div className="eco-icon-wrapper">
                  <Fish size={24} />
                </div>
                <h3>Marine Biodiversity Tracker</h3>
              </div>
              <p>
                Log species sightings, track endangered coral reefs, and map marine health.
              </p>
              <ul className="eco-list">
                <li><CheckCircle2 size={16} /> Species image recognition</li>
                <li><CheckCircle2 size={16} /> Coral bleaching indices</li>
                <li><CheckCircle2 size={16} /> Wildlife protection alerts</li>
              </ul>
              <img src="/images/emerald_teal_reef_bg.png" alt="" className="card-artwork-blend" />
            </div>

            <div className="eco-card">
              <div className="eco-card-header">
                <div className="eco-icon-wrapper">
                  <ShieldCheck size={24} />
                </div>
                <h3>Incident & Hazard Alerts</h3>
              </div>
              <p>
                Instant emergency reporting for oil spills, marine waste, and hazards.
              </p>
              <ul className="eco-list">
                <li><CheckCircle2 size={16} /> Rapid authority dispatch</li>
                <li><CheckCircle2 size={16} /> Real-time status updates</li>
                <li><CheckCircle2 size={16} /> Community verification</li>
              </ul>
              <img src="/images/red_coral_card_bg.png" alt="" className="card-artwork-blend" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="landing-section features-section" id="features">
        <div className="section-container">
          <div className="section-header center">
            <div className="badge-pill">
              <Globe size={14} /> Technology & Impact
            </div>
            <h2 className="section-title">Built for Real-World Marine Impact</h2>
            <p className="section-description">
              State-of-the-art tools designed to translate user engagement into tangible ocean protection.
            </p>
          </div>

          <div className="features-showcase-grid">
            <div className="feature-item">
              <div className="feature-num">01</div>
              <h4>Interactive GIS Mapping</h4>
              <p>Explore high-resolution spatial maps tracking pollution hot spots, volunteer deployment, and marine protected areas.</p>
            </div>

            <div className="feature-item">
              <div className="feature-num">02</div>
              <h4>Live Environmental Analytics</h4>
              <p>Track water clarity indices, debris removal velocity, and community contribution benchmarks in real time.</p>
            </div>

            <div className="feature-item">
              <div className="feature-num">03</div>
              <h4>Verified Green Badging</h4>
              <p>Earn verified credentials and recognition for participating in shoreline restoration drives and logging ecological data.</p>
            </div>

            <div className="feature-item">
              <div className="feature-num">04</div>
              <h4>Collaborative Task Management</h4>
              <p>Assign field tasks, coordinate equipment logistics, and stream real-time photos directly from shoreline sites.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS & COMMUNITY */}
      <section className="landing-section partners-section" id="partners">
        <div className="section-container">
          <div className="section-header center">
            <div className="badge-pill">
              <Heart size={14} /> Global Coalition
            </div>
            <h2 className="section-title">Our Partners & Supporters</h2>
            <p className="section-description">
              Working hand-in-hand with leading oceanographic institutions, coastal municipalities, and global conservation funds.
            </p>
          </div>

          <div className="partners-logo-grid">
            <div className="partner-logo-box">
              <Waves className="partner-icon" />
              <span>Oceania Alliance</span>
            </div>
            <div className="partner-logo-box">
              <Globe className="partner-icon" />
              <span>Global Coastal Guard</span>
            </div>
            <div className="partner-logo-box">
              <Fish className="partner-icon" />
              <span>Marine Life Trust</span>
            </div>
            <div className="partner-logo-box">
              <Anchor className="partner-icon" />
              <span>Blue Horizon Fund</span>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="cta-banner-card">
            <div className="cta-content">
              <h3>Ready to Make a Wave of Change?</h3>
              <p>Join thousands of volunteers and researchers actively restoring our ocean shorelines today.</p>
            </div>
            <button className="cta-action-btn" onClick={handleJoin}>
              Get Started Now <ArrowRight size={18} />
            </button>
            <img src="/images/sidebar_underwater_coral.png" alt="" className="card-artwork-blend" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand-icon-wrapper">
                <Waves size={20} className="brand-icon" />
              </div>
              <span className="brand-title">TerraMarine</span>
              <p className="footer-tagline">
                Turning dreams of clean oceans and thriving shorelines into reality.
              </p>
            </div>

            <div className="footer-links-col">
              <h4>Platform</h4>
              <button onClick={() => scrollToSection('about')}>About Us</button>
              <button onClick={() => scrollToSection('ecosystem')}>Ecosystem</button>
              <button onClick={() => scrollToSection('features')}>Features</button>
              <button onClick={() => scrollToSection('partners')}>Partners</button>
            </div>

            <div className="footer-links-col">
              <h4>Get Involved</h4>
              <button onClick={() => navigate('/register')}>Volunteer Signup</button>
              <button onClick={() => navigate('/login')}>Member Login</button>
              <button onClick={() => navigate('/dashboard')}>Live Dashboard</button>
            </div>

            <div className="footer-links-col">
              <h4>Contact</h4>
              <p>contact@terramarine.org</p>
              <p>Global Coastal Network</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} TerraMarine Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
