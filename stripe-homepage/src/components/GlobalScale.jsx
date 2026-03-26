import './GlobalScale.css';

function GlobalScale() {
  return (
    <section className="global-section" id="solutions">
      <div className="container">
        <div className="global-header">
          <span className="section-label">Global scale</span>
          <h2 className="global-title">
            The backbone for
            <br />
            <span className="gradient-text-orange">internet commerce</span>
          </h2>
          <p className="global-description">
            For ambitious companies around the world, Stripe makes moving money
            as simple and programmable as moving data.
          </p>
        </div>

        <div className="global-stats-grid">
          <div className="global-stat-card large">
            <div className="global-stat-number">250M+</div>
            <div className="global-stat-text">
              API requests per day, making Stripe one of the most used APIs in
              the world
            </div>
          </div>
          <div className="global-stat-card">
            <div className="global-stat-number">99.99%</div>
            <div className="global-stat-text">
              Historical uptime for the Stripe API
            </div>
          </div>
          <div className="global-stat-card">
            <div className="global-stat-number">135+</div>
            <div className="global-stat-text">
              Currencies and payment methods supported
            </div>
          </div>
          <div className="global-stat-card">
            <div className="global-stat-number">47</div>
            <div className="global-stat-text">
              Countries with local acquiring, optimizing acceptance rates
            </div>
          </div>
          <div className="global-stat-card large">
            <div className="global-stat-number">$817B</div>
            <div className="global-stat-text">
              Total payment volume processed in 2023
            </div>
          </div>
        </div>

        <div className="global-logos">
          <p className="logos-label">Trusted by millions of companies worldwide</p>
          <div className="logos-row">
            <div className="logo-item">Amazon</div>
            <div className="logo-item">Google</div>
            <div className="logo-item">Salesforce</div>
            <div className="logo-item">Shopify</div>
            <div className="logo-item">Slack</div>
            <div className="logo-item">Zoom</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GlobalScale;
