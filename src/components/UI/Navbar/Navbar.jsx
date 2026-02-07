import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

/**
 * Navbar Component
 * Header-Navigation mit Logo, Links und User-Menu
 * 
 * @component
 * @example
 * <Navbar>
 *   <Navbar.Brand>Mein App</Navbar.Brand>
 *   <Navbar.Menu>
 *     <Navbar.Link to="/kunden">Kunden</Navbar.Link>
 *     <Navbar.Link to="/versicherer">Versicherer</Navbar.Link>
 *   </Navbar.Menu>
 *   <Navbar.User>
 *     <span>Max Muster</span>
 *   </Navbar.User>
 * </Navbar>
 */
const Navbar = ({ children }) => {
  return <nav className="navbar">{children}</nav>;
};

Navbar.Brand = ({ children }) => (
  <div className="navbar-brand">
    <h2>{children}</h2>
  </div>
);

Navbar.Menu = ({ children }) => (
  <ul className="navbar-menu">{children}</ul>
);

Navbar.Link = ({ to, children, onClick, active = false }) => (
  <li className="navbar-item">
    <Link 
      to={to} 
      className={`navbar-link ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </Link>
  </li>
);

Navbar.User = ({ children }) => (
  <div className="navbar-user">{children}</div>
);

export default Navbar;
