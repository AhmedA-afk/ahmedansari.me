import React from "react";

const Footer = () => (
  <footer className="footer">
    <div>
      <span>© {new Date().getFullYear()} ahmedansari.me</span>
      <span style={{ marginLeft: 16 }}>
        <a href="https://www.linkedin.com/in/ahmedrazaansari/" target="_blank" rel="noopener noreferrer">LinkedIn</a> |
        <a href="mailto:ahmedraza1ansari@gmail.com" style={{ marginLeft: 8 }}>Email</a>
      </span>
    </div>
  </footer>
);

export default Footer;
