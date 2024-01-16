"use client";

import React, { useState, useEffect } from 'react';
import { hasCookie, setCookie } from "cookies-next";
import Link from 'next/link';
import { Button } from '../ui/button';

const CookiesConsent = () => {
    const [showCookiesConsent, setShowCookiesConsent] = useState(false);

    useEffect(() => {
        // Check if the cookie exists
        const cookieExists = hasCookie("cookies-consent");

        // If the cookie doesn't exist, show the cookies consent
        if (!cookieExists) {
            setShowCookiesConsent(true);
        }
    }, []); // Empty array ensures this runs once on mount

    // Set the cookie when the user clicks on the button
    const handleAcceptCookies = () => {
        setCookie("cookies-consent", "true", {
            expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            path: "/",
        });

        setShowCookiesConsent(false);
    };

    // If the cookie exists or user accepted, don't show the cookies consent
    if (!showCookiesConsent) {
        return null;
    }

    // Cancel the cookies consent when the user clicks on the cancel button
    const handleCancelCookies = () => {
        setShowCookiesConsent(false);
    }

    return ( 
        <div className="cookies-consent p-6 fixed bottom-0 bg-slate-200 dark:bg-slate-950">
            <span>
                This website uses cookies to enhance the user experience.
                By continuing to browse the site, you are agreeing to all the Terms and Conditions with our 
                <Link href="/privacy-policy"> <span className="hover:underline">Privacy Policy</span></Link> and <Link href="/terms-and-conditions"><span className="hover:underline">Terms and Conditions</span></Link>. 
            </span>
            <Button className="ml-2">
                <a onClick={handleAcceptCookies}>Accept</a>
            </Button>
            <Button variant="ghost1" className="ml-2">
                <a onClick={handleCancelCookies} >Cancel</a>
            </Button>
        </div>
    );
}
 
export default CookiesConsent;
