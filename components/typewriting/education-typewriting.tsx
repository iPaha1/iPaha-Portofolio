import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const EducationTypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");

    const educationNarrative = `
    My journey in computing and IT has been more than just acquiring degrees; it's been a journey of constant learning, skill development, and applying these in practical scenarios. Here's how I've grown academically and professionally:

    BSc Hons. Computing and IT (2021 - Present)
    At the Open University London, I've not only learned the theoretical aspects of computing but also developed a robust practical skill set.
    - Mastered programming languages and software development life cycle.
    - Engaged in hands-on projects, applying concepts in real-world scenarios.
    - Developed a Learning Management System using JavaScript, React, and Node.js.

    In 2023, I focused on diversifying and certifying my skills:
    - CompTIA A+: Solidified my foundations in IT operations and technical support.
    - Google IT Professional: Enhanced my understanding of network protocols, cloud computing, and security fundamentals.
    - Cisco Certified Support Technician: Gained insights into network setup, management, and troubleshooting.
    - Cisco Networking Essential: Strengthened my networking concepts, preparing me for complex network solutions.

    Each step in my academic journey has been about more than just learning; it's been about growing as a technologist. Balancing academics with project work, I've learned the importance of adaptability, continuous learning, and applying theory to practice in a rapidly evolving tech world. Ready for collaboration, I'm excited to transform ideas into impactful digital experiences.
                                                                                     `;

    const [text] = useTypewriter({
        words: [educationNarrative],
        loop: 0,
        deleteSpeed: 50000,
        typeSpeed: 20,
    });

    useEffect(() => {
        setDisplayedText(text);
    }, [text]);

    return (
        <div>
            {displayedText.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    <br />
                </React.Fragment>
            ))}
        </div>
    );
};

export default EducationTypeWriting;
