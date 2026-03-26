import { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="60" height="25">
            <path fill="#635bff" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a13.77 13.77 0 0 1-4.56.75c-4.14 0-6.6-2.55-6.6-6.8 0-3.8 2.15-6.91 6.07-6.91 3.56 0 5.92 2.58 5.92 6.47 0 .58-.02 1.17-.02 1.57zm-8.06-2.6h4.44c0-1.56-.7-2.68-2.14-2.68-1.36 0-2.18 1.06-2.3 2.68zM40.95 20.3V6.55h3.67l.25 1.27c1.05-1.08 2.34-1.58 3.64-1.58v3.88c-.19-.04-.53-.06-.93-.06-1 0-2.17.37-2.82 1v9.24h-3.81zm-8.7-6.86c0-1.4-.68-2.28-1.99-2.28-1 0-1.84.57-2.32 1.15v5.17c.45.5 1.28.96 2.23.96 1.45 0 2.08-1.1 2.08-2.64v-2.36zm3.84 1.97c0 3.44-1.88 5.1-4.71 5.1-1.33 0-2.4-.47-3.22-1.16l-.18.85h-3.68V1.22h3.81v6.2c.85-.7 1.97-1.18 3.35-1.18 3.08 0 4.63 2.15 4.63 5.83v3.34zm-16.97-9.1h3.81V20.3h-3.81V6.31zm0-5.09h3.81v3.39h-3.81V1.22zM8.53 11.16c-.91-.39-1.49-.78-1.49-1.37 0-.52.38-.87 1.11-.87.95 0 1.97.42 2.94.92l1.2-2.98A9.22 9.22 0 0 0 8.06 5.8c-3.13 0-5.18 1.73-5.18 4.22 0 2.2 1.51 3.3 3.61 4.09 1.15.44 1.69.84 1.69 1.44 0 .6-.48 1-1.35 1a7.8 7.8 0 0 1-3.41-1.04L2 18.63a10.16 10.16 0 0 0 4.45 1.02c3.35 0 5.43-1.63 5.43-4.36 0-2.15-1.42-3.28-3.35-4.13zM0 6.55h3.82v13.42H0V6.55z" />
          </svg>
        </div>

        <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          <a href="#products" onClick={() => setMobileMenuOpen(false)}>Products</a>
          <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
          <a href="#developers" onClick={() => setMobileMenuOpen(false)}>Developers</a>
          <a href="#resources" onClick={() => setMobileMenuOpen(false)}>Resources</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        </div>

        <div className="navbar-actions">
          <a href="#contact" className="nav-link-contact">Contact sales</a>
          <a href="#signin" className="nav-btn-signin">
            Sign in <span className="arrow">&rarr;</span>
          </a>
        </div>

        <button
          className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#products" onClick={() => setMobileMenuOpen(false)}>Products</a>
          <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
          <a href="#developers" onClick={() => setMobileMenuOpen(false)}>Developers</a>
          <a href="#resources" onClick={() => setMobileMenuOpen(false)}>Resources</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact sales</a>
          <a href="#signin" className="mobile-signin" onClick={() => setMobileMenuOpen(false)}>
            Sign in <span className="arrow">&rarr;</span>
          </a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
