import './Footer.css';

const footerLinks = {
  Products: [
    'Payments',
    'Billing',
    'Connect',
    'Invoicing',
    'Terminal',
    'Financial Connections',
    'Identity',
    'Climate',
  ],
  Solutions: [
    'SaaS',
    'Marketplaces',
    'Platforms',
    'Ecommerce',
    'Creator economy',
    'Crypto',
    'Embedded finance',
    'Global businesses',
  ],
  Developers: [
    'Documentation',
    'API reference',
    'API status',
    'API changelog',
    'Build a Stripe app',
  ],
  Resources: [
    'Support center',
    'Support plans',
    'Guides',
    'Customer stories',
    'Blog',
    'Annual conference',
    'Privacy & terms',
    'Licenses',
  ],
  Company: [
    'Jobs',
    'Newsroom',
    'Stripe Press',
    'Partners',
  ],
};

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="60" height="25" className="footer-logo">
              <path fill="#635bff" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a13.77 13.77 0 0 1-4.56.75c-4.14 0-6.6-2.55-6.6-6.8 0-3.8 2.15-6.91 6.07-6.91 3.56 0 5.92 2.58 5.92 6.47 0 .58-.02 1.17-.02 1.57zm-8.06-2.6h4.44c0-1.56-.7-2.68-2.14-2.68-1.36 0-2.18 1.06-2.3 2.68zM40.95 20.3V6.55h3.67l.25 1.27c1.05-1.08 2.34-1.58 3.64-1.58v3.88c-.19-.04-.53-.06-.93-.06-1 0-2.17.37-2.82 1v9.24h-3.81zm-8.7-6.86c0-1.4-.68-2.28-1.99-2.28-1 0-1.84.57-2.32 1.15v5.17c.45.5 1.28.96 2.23.96 1.45 0 2.08-1.1 2.08-2.64v-2.36zm3.84 1.97c0 3.44-1.88 5.1-4.71 5.1-1.33 0-2.4-.47-3.22-1.16l-.18.85h-3.68V1.22h3.81v6.2c.85-.7 1.97-1.18 3.35-1.18 3.08 0 4.63 2.15 4.63 5.83v3.34zm-16.97-9.1h3.81V20.3h-3.81V6.31zm0-5.09h3.81v3.39h-3.81V1.22zM8.53 11.16c-.91-.39-1.49-.78-1.49-1.37 0-.52.38-.87 1.11-.87.95 0 1.97.42 2.94.92l1.2-2.98A9.22 9.22 0 0 0 8.06 5.8c-3.13 0-5.18 1.73-5.18 4.22 0 2.2 1.51 3.3 3.61 4.09 1.15.44 1.69.84 1.69 1.44 0 .6-.48 1-1.35 1a7.8 7.8 0 0 1-3.41-1.04L2 18.63a10.16 10.16 0 0 0 4.45 1.02c3.35 0 5.43-1.63 5.43-4.36 0-2.15-1.42-3.28-3.35-4.13zM0 6.55h3.82v13.42H0V6.55z" />
            </svg>
            <p className="footer-tagline">
              Financial infrastructure for the internet.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div className="footer-column" key={category}>
              <h4 className="footer-column-title">{category}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>&copy; {new Date().getFullYear()} Stripe, Inc.</span>
          </div>
          <div className="footer-bottom-right">
            <div className="footer-social">
              <a href="#twitter" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#github" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>
            <div className="footer-country">
              <span>🌐 United States (English)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
