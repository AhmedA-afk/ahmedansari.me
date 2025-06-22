import React, { useState } from 'react';
import '../assets/Experience.css';

const experiences = [
  {
    date: '2024 Summer Internship',
    title: 'Data Science Intern',
    company: 'Trionic Technologies LLP.',
    description: 'I worked on developing machine learning algorithms and collaborated with data scientists and analysts to create predictive models and insights. Currently progressing towards building and fine tuning Large Language Models (LLMs) and exploring Generative AI with main focus on NLP Tasks.'
  },
  {
    date: '2023-2024',
    title: 'Technical Support',
    company: 'Volunteer',
    description: 'As a core member of The Hackers Meetup (THM) India, and THM CHARUSAT Chapter, I am responsible as creative member generating ideas and designing products related to THM and Cybersecurity. As a core lead in AI/ML Club, responsible for organizing events and promoting AI/ML knowledge & enthusiasm.'
  },
  {
    date: '2023 Summer Internship',
    title: 'Virtual Intern',
    company: 'Forage:',
    description: 'Completed 7 micro-internships on Forage from different companies and domains like API Development (VISA), Solutions Architecture (AWS), Cyber Security (Goldman Sachs), Dash Automation (Quantium), Data Analysis and Coding (Deloitte), Data Science (British Airways) and Software Development Infrastructure (Accenture).'
  }
];

const Experience = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex === experiences.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? experiences.length - 1 : prevIndex - 1));
  };

  const currentExperience = experiences[activeIndex];

  return (
    <div className="experience-container">
      <div className="experience-content">
        <p className="experience-date">{currentExperience.date}</p>
        <h3 className="experience-title">{currentExperience.title}</h3>
        <p className="experience-company">{currentExperience.company}</p>
        <p className="experience-description">{currentExperience.description}</p>
      </div>

      <button onClick={prevSlide} className="arrow left-arrow">&lt;</button>
      <button onClick={nextSlide} className="arrow right-arrow">&gt;</button>
    </div>
  );
};

export default Experience; 