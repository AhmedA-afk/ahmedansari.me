import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../assets/home.css";

const Home = () => (
  <>
    <Header />
    <main className="main-content">
      <section className="hero">
        <h1>Ahmed Raza Ansari</h1>
        <p>Creative Technologist | Designer | Developer</p>
      </section>
      <section className="experience">
        <h2>Experience</h2>
        <ul>
          <li>Freelance Web Developer & Designer</li>
          <li>UI/UX Projects</li>
        </ul>
      </section>
      <section className="education">
        <h2>Education</h2>
        <ul>
          <li>Bachelor of Design, NIFT</li>
        </ul>
      </section>
      <section className="skills">
        <h2>Skills</h2>
        <ul>
          <li>Web Development</li>
          <li>UI/UX Design</li>
          <li>Art & Illustration</li>
        </ul>
      </section>
      <section className="artistic-style">
        <h2>Artistic Style</h2>
        <p>Minimal, expressive, and functional design with a focus on user experience.</p>
      </section>
      <section className="contact">
        <h2>Contact</h2>
        <p>Email: <a href="mailto:ahmedraza1ansari@gmail.com">ahmedraza1ansari@gmail.com</a></p>
      </section>
    </main>
    <Footer />
  </>
);

export default Home;
