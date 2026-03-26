import { useState } from 'react';
import './Pricing.css';

const plans = [
  {
    name: 'Integrated',
    price: '2.9% + 30¢',
    description: 'per successful card charge',
    features: [
      'Access to all payment methods',
      'Prebuilt checkout page',
      'Real-time reporting',
      'Financial reconciliation',
      'Customer support',
    ],
    cta: 'Start with Integrated',
    popular: false,
  },
  {
    name: 'Customized',
    price: 'Custom',
    description: 'for businesses with large payments volume',
    features: [
      'Everything in Integrated',
      'Custom pricing for volume',
      'Dedicated account manager',
      'Priority phone support',
      'Migration assistance',
      'Custom reporting',
    ],
    cta: 'Contact sales',
    popular: true,
  },
  {
    name: 'Platform',
    price: 'Custom',
    description: 'for platforms and marketplaces',
    features: [
      'Everything in Customized',
      'Multi-party payments',
      'Platform payouts',
      'Connected accounts',
      'Onboarding and verification',
      'Custom branding',
    ],
    cta: 'Contact sales',
    popular: false,
  },
];

function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="pricing-section" id="pricing">
      <div className="container">
        <div className="pricing-header">
          <span className="section-label">Pricing</span>
          <h2 className="pricing-title">
            Simple, transparent
            <br />
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="pricing-description">
            No setup fees, no monthly fees, no hidden fees. Pay only for what
            you use with pay-as-you-go pricing.
          </p>
          <div className="pricing-toggle">
            <span className={!annual ? 'active' : ''}>Monthly</span>
            <button
              className={`toggle-btn ${annual ? 'active' : ''}`}
              onClick={() => setAnnual(!annual)}
              aria-label="Toggle pricing"
            >
              <span className="toggle-knob"></span>
            </button>
            <span className={annual ? 'active' : ''}>
              Annual <span className="save-badge">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              key={index}
            >
              {plan.popular && (
                <div className="popular-badge">Most Popular</div>
              )}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">{plan.price}</div>
              <p className="plan-description">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M13.3 4.3L6 11.6 2.7 8.3"
                        stroke="#635bff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#start"
                className={`plan-cta ${plan.popular ? 'primary' : ''}`}
              >
                {plan.cta} <span className="arrow">&rarr;</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
