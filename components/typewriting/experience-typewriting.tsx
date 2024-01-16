import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const SkillsTypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");

    // Typewriter effect setup
    const [text] = useTypewriter({
        words: [
            `As a dynamic self-learner and a student at the Open University London, I've built a diverse portfolio of software development projects, showcasing my proficiency and adaptability in the tech industry. Learning Management System: Developed an intuitive LMS using JavaScript, React, and Node.js, focused on enhancing the educational experience for both teachers and students.

            AI SaaS Platform: Created an AI-driven SaaS website, demonstrating my ability to integrate cutting-edge AI technologies for innovative solutions.
            
            E-Commerce Website with Admin Dashboard: Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.
            
            Event Management and Booking System: Engineered a user-centric event management website with backend functionalities, improving my skills in database management and UI design.
            
            Python Projects: Ventured into diverse applications using Python, from data analysis to automation, reflecting my versatility and commitment to learning new technologies.
            
            Balancing my academic studies with hands-on project work, I've consistently demonstrated a passion for learning, adaptation, and applying theoretical knowledge in practical scenarios in the fast-evolving tech world. I'm ready to collaborate and transform ideas into impactful digital experiences.
            
            Check out my projects on the Projects page.                                                                  `
        ],
        loop: 0,
        deleteSpeed: 50000,
        typeSpeed: 20,
    });

    useEffect(() => {
        // Update displayed text without line breaks
        setDisplayedText(text);
    }, [text]);

    return (
        <div className="hero-typewriting">
            <div>
                <h1 className="text-lg font-light mt-10">
                    {displayedText.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </h1>
            </div>
        </div>
    );
};

export default SkillsTypeWriting;
