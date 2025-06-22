import React from "react";
import { Link, NavLink } from "react-router-dom";

const Header = () => (
  <header className="header">
    <div className="header-content">
      <div className="site-title">
        <Link to="/">ahmedansari.me</Link>
      </div>
      <nav className="main-nav">
        <ul className="nav-list">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/certificates">Certificates</NavLink></li>
          <li><NavLink to="/about">About</NavLink></li>
          <li><NavLink to="/projects">Projects</NavLink></li>
          <li><NavLink to="/sketches">Sketches</NavLink></li>
          <li><NavLink to="/blog">Blog</NavLink></li>
        </ul>
      </nav>
    </div>
  </header>
);

export default Header;
