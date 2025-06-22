import React from 'react';
import '../assets/Skills.css';

const skillsData = [
  'Machine Learning',
  'Artificial Intelligence',
  'Data Science & Analytics',
  'Python Programming'
];

const Skills = () => {
  return (
    <div className="skills-container">
      <ul className="skills-list">
        {skillsData.map((skill, index) => (
          <li key={index}>
            <span className="checkmark">✓</span>
            {skill}
          </li>
        ))}
      </ul>
      <div className="skills-footer">
        <h5>08_SKILLS</h5>
      </div>
    </div>
  );
};

export default Skills; 