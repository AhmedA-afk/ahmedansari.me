import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Experience from "../components/Experience";
import Education from "../components/Education";
import Skills from "../components/Skills";
import "../assets/home.css";
import profileImg from "../assets/profile.jpg";
import drawingImg from "../assets/drawing.png";
import coffeeImg from "../assets/coffee.png";
import catImg from "../assets/cat.png";
import certificateImg from "../assets/certificate.png";
import artisticImg from "../assets/artistic.png";
import githubImg from "../assets/github.png";

const Home = () => (
  <div className="home-page-wrapper">
    <Header />
    <main className="wix-layout">
      {/* --- ROW 1 --- */}
      {/* Left Column */}
      <section className="left-column">
        <img src={profileImg} alt="Ahmed Ansari" className="profile-image" />
      </section>

      {/* Center Column */}
      <section className="center-column">
        <div className="hero-text-content">
          <h1>Hi, I'm Ahmed Ansari</h1>
          <p>A versatile fresher with skills in Machine Learning, Data Science, Analysis and creative work. I specialize in NLP and LLM models and am passionate about creating interactive and responsive websites too. Welcome to my portfolio!</p>
          <a href="/about" className="about-link">01_ABOUT ME &gt;</a>
        </div>
      </section>

      {/* Right Column */}
      <section className="right-column">
        <img src={drawingImg} alt="Ahmed's Drawing" className="workbench-image" />
        <div className="image-overlay-text">
          <h2>02_My Favorite Flowers</h2>
        </div>
      </section>
    </main>

    {/* --- ROW 2 --- */}
    <main className="wix-layout-row2">
      {/* Left Column */}
      <section className="row2-left-column">
        <div className="image-overlay-text top-text">
          <h3>03_My Favorite Drink</h3>
        </div>
        <img src={coffeeImg} alt="Coffee" className="row2-image" />
      </section>

      {/* Center Column */}
      <section className="row2-center-column">
        <Experience />
      </section>

      {/* Right Column */}
      <section className="row2-right-column">
        <div className="image-overlay-text top-text">
          <h3>04_My Favorite Animal</h3>
        </div>
        <img src={catImg} alt="Cat" className="row2-image" />
      </section>
    </main>

    {/* --- ROW 3 --- */}
    <main className="wix-layout-row3">
      {/* Left Column */}
      <section className="row3-left-column">
        <Education />
      </section>

      {/* Center Column */}
      <section className="row3-center-column">
        <img src={certificateImg} alt="Certificates" className="row3-image" />
        <div className="image-overlay-text">
          <h4>07_VIEW MY CERTIFICATIONS &gt;</h4>
        </div>
      </section>

      {/* Right Column */}
      <section className="row3-right-column">
        <Skills />
      </section>
    </main>

    {/* --- ROW 4 --- */}
    <main className="wix-layout-row4">
      {/* Left Column */}
      <section className="row4-left-column">
        <img src={artisticImg} alt="Artistic Style" className="row4-image" />
        <div className="image-overlay-text">
          <h3>09_MY ARTISTIC STYLE</h3>
        </div>
      </section>

      {/* Center Column */}
      <section className="row4-center-column">
        <div className="contact-content">
          <p className="contact-intro">
            Interested to know more about me or have something to share? Please feel free to contact me with any inquiries or collaboration opportunities.
          </p>
          <div className="contact-details">
            <p>Email: ahmedraza1ansari@gmail.com</p>
            <p>Phone: +91 780-189-1358</p>
          </div>
          <a href="/contact" className="contact-link">10_CONTACT ME</a>
        </div>
      </section>

      {/* Right Column */}
      <section className="row4-right-column">
        <img src={githubImg} alt="GitHub" className="row4-image" />
        <div className="image-overlay-text">
          <a href="https://github.com/AhmedA-afk" target="_blank" rel="noopener noreferrer">
            <h3>11_VIEW MY GITHUB &gt;</h3>
          </a>
        </div>
      </section>
    </main>

    {/* --- Links Row --- */}
    <div className="links-row">
      <div className="link-column">
        <a href="https://twitter.com/Ahmed1Ansari" target="_blank" rel="noopener noreferrer">
          X / Twitter
        </a>
      </div>
      <div className="link-column">
        <a href="https://www.linkedin.com/in/ahmed-1-ansari/" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      </div>
      <div className="link-column">
        <a href="https://github.com/AhmedA-afk" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </div>

    <Footer key="footer-force-refresh" />
  </div>
);

export default Home;
