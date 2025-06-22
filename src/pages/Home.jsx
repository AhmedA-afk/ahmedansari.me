import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../assets/home.css";

const Home = () => (
  <>
    <Header />
    <main className="wix-layout">
      {/* Left Column - Profile Image */}
      <section className="left-column">
        <img src="/src/assets/profile.jpg" alt="Ahmed Ansari" className="profile-image" />
      </section>

      {/* Center Column - Main Content */}
      <section className="center-column">
        <div className="hero-text-content">
          <h1>Hi, I'm Ahmed Ansari</h1>
          <p>A versatile fresher with skills in Machine Learning, Data Science, Analysis and creative work. I specialize in NLP and LLM models and am passionate about creating interactive and responsive websites too. Welcome to my portfolio!</p>
          <a href="/about" className="about-link">01_ABOUT ME &gt;</a>
        </div>
        
        <div className="workbench-section">
          <h2>02_MY Workbench</h2>
        </div>
      </section>

      {/* Right Column - Workbench Image */}
      <section className="right-column">
        <img src="/src/assets/profile.jpg" alt="Ahmed's Workbench" className="workbench-image" />
      </section>
    </main>
    <Footer />
  </>
);

export default Home;
