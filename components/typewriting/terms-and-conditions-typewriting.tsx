"use client";

import React, { useState, useEffect } from 'react';
import { useTypewriter } from 'react-simple-typewriter';

const TermsAndConditionTypeWriting = () => {
    const [displayedText, setDisplayedText] = useState("");

    // Typewriter effect setup
    const [text] = useTypewriter({
        words: [
            `Last updated: 16 January 2024  \n\n

            Welcome to Isaac Paha's Portfolio Website.
            These terms and conditions outline the rules and regulations for the use of Isaac Paha's Website, located at www.isaacpaha.com.\n

            Intellectual Property Rights
            Other than the content you own, under these Terms, Isaac paha and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted a limited license only for purposes of viewing the material contained on this Website.\n\n

            Restrictions
            You are specifically restricted from all of the following:
            - Publishing any Website material in any other media without proper attribution.
            - Selling, sublicensing and/or otherwise commercializing any Website material.
            - Using this Website in any way that is or may be damaging to this Website or to Isaac Paha.
            - Using this Website contrary to applicable laws and regulations, or in any way that may cause harm to the Website, or to any person or business entity.\n

            No Warranties
            This Website is provided “as is,” with all faults, and Isaac Paha expresses no representations or warranties, of any kind related to this Website or the materials contained on this Website.\n

            Limitation of Liability
            In no event shall Isaac Paha, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Isaac Paha, including its officers, directors, and employees, shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.\n

            Indemnification
            You hereby indemnify to the fullest extent Isaac Paha from and against any and/or all liabilities, costs, demands, causes of action, damages, and expenses arising in any way related to your breach of any of the provisions of these Terms.\n

            Variation of Terms
            Isaac Paha is permitted to revise these Terms at any time as it sees fit, and by using this Website you are expected to review these Terms on a regular basis.\n

            Assignment
            Isaac Paha is allowed to assign, transfer, and subcontract its rights and/or obligations under these Terms without any notification. However, you are not allowed to assign, transfer, or subcontract any of your rights and/or obligations under these Terms.\n

            Entire Agreement
            These Terms constitute the entire agreement between Isaac Paha and you in relation to your use of this Website, and supersede all prior agreements and understandings.\n

            Governing Law & Jurisdiction
            These Terms will be governed by and interpreted in accordance with the laws of the United Kingdom, and you submit to the non-exclusive jurisdiction of the courts located in the United Kingdom for the resolution of any disputes.\n

            Privacy and Data Protection
            Your privacy is important to us. It is Isaac Paha's policy to respect your privacy and comply with any applicable law and regulation regarding any personal information we may collect about you, including across our website, [Your Website URL], and other sites we own and operate. Our policy is in compliance with the UK GDPR and the Data Protection Act 2018.\n
    
            Contact Information
            If you have any questions or concerns about these Terms, please contact pahaisaac@gmail.com.\n
                                                                                         `,
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
        <div className="terms-and-conditions">
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

export default TermsAndConditionTypeWriting;
