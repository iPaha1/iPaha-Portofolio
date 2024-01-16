import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const DownloadCVTypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");
    const [isVisible, setIsVisible] = useState(true); // State to control visibility

    // Typewriter effect setup
    const [text] = useTypewriter({
        words: [
            "If download doesn't start automatically,",
            "then you will need to be log in google account to download my CV",
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
        }, 6300); // 35 seconds

        // Clean up function
        return () => clearTimeout(timer);
    }, []); // Effect runs only on mount

    return (
        <div className="hero-typewriting">
            {isVisible && (
                <div>
                    <h1 className="text-3xl font-ligh">{displayedText}</h1>
                </div>
            )}
        </div>
    );
};

export default DownloadCVTypeWriting;
