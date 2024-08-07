"use client";

import { UserButton } from "@clerk/nextjs";
import { GitHubLogoIcon, InstagramLogoIcon, LinkedInLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import Link from "next/link";

const Footer = () => {
    return (
        <div  className="border-t">
        <footer>
            <div className="mx-auto py-10">
                <p className="dark:hidden text-center text-xs text-black">
                    &copy; 2024 <a href="/sign-in">iPaha</a> Portfolio, Inc. All rights reserved.
                </p>

                <p className="dark:hidden text-center text-xs text-black sm:">
                    <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                    <span className="mx-2">|</span>
                    <Link href="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
                    {/* <Link href="" className="hover:underline">FAQ</Link> */}
                </p>

                <p className="hidden dark:block text-center text-xs text-white">
                    &copy; 2024 <a href="/sign-in">iPaha</a> Portfolio, Inc. All rights reserved.
                </p>

                <p className="hidden dark:block text-center text-xs text-white">
                    <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                    <span className="mx-2">|</span>
                    <Link href="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
                    {/* <Link href="" className="hover:underline">FAQ</Link> */}
                </p>

                <motion.div 
                whileHover={{ scale: 1.5 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 10 }}
                >
                <p className="flex items-center gap-2 ml-4 justify-center mt-4" >
                    <a href="https://www.linkedin.com/in/isaac-paha-578911a9/" target="_blank" rel="noopener noreferrer"><LinkedInLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></a>
                    <a href="https://github.com/iPaha1" target="_blank" rel="noopener noreferrer"><GitHubLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></a>
                </p>
            
            </motion.div>
           
            </div>
        </footer>
        </div>
    )
}

export default Footer;