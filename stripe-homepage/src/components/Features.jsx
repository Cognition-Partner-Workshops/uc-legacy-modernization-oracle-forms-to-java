import './Features.css';

const features = [
  {
    icon: '💳',
    title: 'Payments',
    description: 'A fully integrated suite of payments products. Accept payments online, in person, or through your platform.',
    color: '#635bff',
  },
  {
    icon: '🔄',
    title: 'Billing',
    description: 'Smart invoicing, subscription management, and recurring payments built to grow with your business.',
    color: '#00d4ff',
  },
  {
    icon: '🔗',
    title: 'Connect',
    description: 'Everything platforms need to get sellers paid. Route payments, onboard accounts, and manage payouts.',
    color: '#ff49db',
  },
  {
    icon: '📊',
    title: 'Sigma',
    description: 'Your business data at your fingertips. Create custom reports with SQL right inside the Dashboard.',
    color: '#00d924',
  },
  {
    icon: '🛡️',
    title: 'Radar',
    description: 'Fight fraud with machine learning. Radar uses adaptive ML models trained on data across the Stripe network.',
    color: '#ff6b35',
  },
  {
    icon: '🏦',
    title: 'Atlas',
    description: 'Start an internet business from anywhere. Form a company, open a bank account, and start accepting payments.',
    color: '#635bff',
  },
];

function Features() {
  return (
    <section className="features-section" id="products">
      <div className="container">
        <div className="features-header">
          <span className="section-label">Products</span>
          <h2 className="features-title">
            A complete payments platform,
            <br />
            <span className="gradient-text">engineered for growth</span>
          </h2>
          <p className="features-description">
            Whether you&apos;re a startup or a Fortune 500 company, Stripe&apos;s unified
            payments platform is designed to help you grow revenue and accelerate
            innovation.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index} style={{ '--accent': feature.color }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <a href="#learn" className="feature-link">
                Learn more <span className="arrow">&rarr;</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
