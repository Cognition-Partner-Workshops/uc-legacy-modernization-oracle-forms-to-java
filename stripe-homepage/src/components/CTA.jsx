import './CTA.css';

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-bg">
        <div className="cta-orb cta-orb-1"></div>
        <div className="cta-orb cta-orb-2"></div>
      </div>
      <div className="container cta-content">
        <h2 className="cta-title">Ready to get started?</h2>
        <p className="cta-description">
          Explore Stripe Docs, contact us to learn more, or create an account
          instantly and start accepting payments today.
        </p>
        <div className="cta-buttons">
          <a href="#start" className="btn-primary">
            Start now <span className="arrow">&rarr;</span>
          </a>
          <a href="#contact" className="btn-secondary">
            Contact sales <span className="arrow">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default CTA;
