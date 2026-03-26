import './Hero.css';

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-bg">
        <div className="hero-gradient-orb orb-1"></div>
        <div className="hero-gradient-orb orb-2"></div>
        <div className="hero-gradient-orb orb-3"></div>
        <div className="hero-grid-overlay"></div>
      </div>

      <div className="hero-content container">
        <h1 className="hero-title">
          Financial infrastructure
          <br />
          <span className="hero-highlight">for the internet</span>
        </h1>
        <p className="hero-subtitle">
          Millions of companies of all sizes use Stripe to accept payments,
          grow their revenue, and accelerate new business opportunities.
          Join the platforms and marketplaces transforming how they do business online.
        </p>
        <div className="hero-cta">
          <a href="#start" className="btn-primary">
            Start now <span className="arrow">&rarr;</span>
          </a>
          <a href="#contact" className="btn-secondary">
            Contact sales <span className="arrow">&rarr;</span>
          </a>
        </div>
      </div>

      <div className="hero-visual container">
        <div className="hero-dashboard">
          <div className="dashboard-header">
            <div className="dashboard-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <span className="dashboard-title">Dashboard</span>
          </div>
          <div className="dashboard-body">
            <div className="dashboard-sidebar">
              <div className="sidebar-item active">Overview</div>
              <div className="sidebar-item">Payments</div>
              <div className="sidebar-item">Balances</div>
              <div className="sidebar-item">Customers</div>
              <div className="sidebar-item">Products</div>
            </div>
            <div className="dashboard-main">
              <div className="dashboard-stats">
                <div className="stat-card">
                  <span className="stat-label">Total revenue</span>
                  <span className="stat-value">$1,250,500</span>
                  <span className="stat-change positive">+12.5%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">New customers</span>
                  <span className="stat-value">2,420</span>
                  <span className="stat-change positive">+8.2%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Transactions</span>
                  <span className="stat-value">14,800</span>
                  <span className="stat-change positive">+22.4%</span>
                </div>
              </div>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <span>Revenue over time</span>
                </div>
                <div className="chart-bars">
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '55%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '65%' }}></div>
                  <div className="chart-bar" style={{ height: '50%' }}></div>
                  <div className="chart-bar" style={{ height: '75%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                  <div className="chart-bar" style={{ height: '85%' }}></div>
                  <div className="chart-bar highlight" style={{ height: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
