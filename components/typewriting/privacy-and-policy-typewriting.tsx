"use client";

import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const PrivacyAndPolicyTypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");

    // Typewriter effect setup
    const [text] = useTypewriter({
        words: [
            `Last updated: 16 January 2024\n\n

            Introduction\n
            Your privacy is critically important to us. At Isaac Paha's Portfolio, located at [Your Website URL], we have a few fundamental principles regarding privacy...\n

            Website Visitors\n
            Like most website operators, Isaac Paha's Portfolio collects non-personally-identifying information typically made available by web browsers and servers, such as browser type, language preference, referring site, and the date and time of each visitor request...\n

            Gathering of Personally-Identifying Information\n
            Certain visitors to Isaac Paha's Portfolio choose to interact with the website in ways that require Isaac Paha to gather personally-identifying information...\n

            Security\n
            The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure...\n

            Cookies\n
            A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's browser provides to the website each time the visitor returns...\n

            Privacy Policy Changes\n
            Although most changes are likely to be minor, Isaac Paha may change its Privacy Policy from time to time, and in Isaac Paha's sole discretion...\n

            Contact Information\n
            For any questions about this Privacy Policy, please contact isaacpaha@gmail.com\n`,
        ],
        loop: 0,
        deleteSpeed: 5000,
        typeSpeed: 1,
    });

    useEffect(() => {
        // Update displayed text
        setDisplayedText(text);
    }, [text]);

    return (
        <div className="flex flex-col items-center justify-center p-8">
            
            <h1 className="text-lg font-light mt-10">
                {displayedText.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                        {line}
                        <br />
                    </React.Fragment>
                ))}
            </h1>
        </div>
    );
};

export default PrivacyAndPolicyTypeWriting;
