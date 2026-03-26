import './Developers.css';

function Developers() {
  return (
    <section className="developers-section" id="developers">
      <div className="container">
        <div className="developers-grid">
          <div className="developers-info">
            <span className="section-label">Developers</span>
            <h2 className="developers-title">
              Designed for developers,
              <br />
              <span className="gradient-text-green">built for business</span>
            </h2>
            <p className="developers-description">
              Stripe&apos;s APIs and developer tools make it easy to build, test, and
              manage your integration. Well-documented APIs, client libraries,
              and sample code get you up and running quickly.
            </p>
            <div className="developers-stats">
              <div className="dev-stat">
                <span className="dev-stat-value">99.99%</span>
                <span className="dev-stat-label">Uptime SLA</span>
              </div>
              <div className="dev-stat">
                <span className="dev-stat-value">135+</span>
                <span className="dev-stat-label">Currencies supported</span>
              </div>
              <div className="dev-stat">
                <span className="dev-stat-value">47</span>
                <span className="dev-stat-label">Countries available</span>
              </div>
            </div>
            <a href="#docs" className="btn-docs">
              Read the docs <span className="arrow">&rarr;</span>
            </a>
          </div>

          <div className="developers-code">
            <div className="code-window">
              <div className="code-header">
                <div className="code-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="code-tabs">
                  <span className="code-tab active">payment.js</span>
                  <span className="code-tab">server.py</span>
                </div>
              </div>
              <div className="code-body">
                <pre>
                  <code>
{`const stripe = require('stripe')('sk_test_...');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  automatic_payment_methods: {
    enabled: true,
  },
});

// Returns a client secret for the frontend
res.json({
  clientSecret: paymentIntent.client_secret,
});`}
                  </code>
                </pre>
              </div>
            </div>

            <div className="code-features">
              <div className="code-feature">
                <div className="code-feature-icon">📦</div>
                <div>
                  <strong>Libraries for every language</strong>
                  <p>Python, Ruby, PHP, Java, Node.js, Go, and .NET</p>
                </div>
              </div>
              <div className="code-feature">
                <div className="code-feature-icon">🔧</div>
                <div>
                  <strong>Prebuilt integrations</strong>
                  <p>Work with platforms like Shopify, WooCommerce, and more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Developers;
