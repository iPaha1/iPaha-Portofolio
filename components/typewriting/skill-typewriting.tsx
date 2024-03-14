import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const TypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");

    // Typewriter effect setup
    const [text] = useTypewriter({
        words: [
            `As a versatile technologist, I excel in front-end and back-end development, with a focus on JavaScript and its frameworks like React JS and Node JS. My expertise extends to Typescript, enhancing code reliability, and I am adept at crafting visually appealing interfaces using HTML, CSS, and frameworks like Tailwind and Bootstrap. I bring interactivity and style to my projects with tools like Framer Motion and React Spring. 
            
            My full-stack capabilities are bolstered by proficiency in Next JS for server-side rendering and SEO optimization, along with skills in state management using Redux and React Router for seamless navigation. I'm also skilled in Next Auth and Next SEO for secure and visible web applications. Constantly adapting to new technologies, I thrive on challenges and am always eager to explore innovative solutions in the evolving tech landscape. I'm ready to collaborate and transform ideas into impactful digital experiences.                                                                `,
        ],
        loop: 0,
        deleteSpeed: 50000,
        typeSpeed: 1,
    });

    useEffect(() => {
        // Update displayed text
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

export default TypeWriting;
