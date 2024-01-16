import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const HeroTypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");
    const [isVisible, setIsVisible] = useState(true); // State to control visibility

    // Typewriter effect setup
    const [text] = useTypewriter({
        words: [
            'Wait for it...',
            "Resize the window slightly to see the 3D effect.",
            "Scroll down to see it change motion.",
            "Hover over each letter to see the magic.",
            "Explore the other pages,",
            "and see what I have to offer",
            "And don't forget to download my CV",
            "Thank you for visiting !",
            ""
        ],
        loop: 0,
        onLoopDone: () => setDisplayedText(''), // Clear text when loop is done
        deleteSpeed: 5,
        typeSpeed: 20,
    });

    useEffect(() => {
        // Update displayed text
        setDisplayedText(text);

        // Additional effects or logic based on the current text
        if (text === "Thank you for visiting !") {
            addImpactEffecttoLastChar();
        }
    }, [text]); // Dependency on the text from typewriter

    const addImpactEffecttoLastChar = () => {
        const lastChar = document.querySelector(".hero-typewriting h1 span:last-child");
        if (lastChar) {
            lastChar.classList.add("impact");
        }
    };

    useEffect(() => {
        // Timer to hide <h1> after 40 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 20000); // 35 seconds

        // Clean up function
        return () => clearTimeout(timer);
    }, []); // Effect runs only on mount

    return (
        <div className="hero-typewriting">
            {isVisible && (
                <div>
                    <h1 className="text-5xl font-light">{displayedText}</h1>
                </div>
            )}
        </div>
    );
};

export default HeroTypeWriting;
