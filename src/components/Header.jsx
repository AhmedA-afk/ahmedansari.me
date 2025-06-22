import React from "react";
import { Link } from "react-router-dom";

const Header = () => (
  <header className="header">
    <nav>
      <ul className="nav-list">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/certificates">Certificates</Link></li>
        <li><Link to="/sketches">Sketches</Link></li>
        <li><Link to="/blog">Blog</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  </header>
);

export default Header;
