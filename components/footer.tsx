"use client";

import { GitHubLogoIcon, InstagramLogoIcon, LinkedInLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

const Footer = () => {
    return (
        <div  className="border-t">
        <footer>
            <div className="mx-auto py-10">
                <p className="dark:hidden text-center text-xs text-black">
                    &copy; 2023 iPaha Portfolio, Inc. All rights reserved.
                </p>

                <p className="dark:hidden text-center text-xs text-black sm:">
                    <a href="" className="hover:underline">Privacy</a>
                    <span className="mx-2">|</span>
                    <a href="" className="hover:underline">Terms</a>
                    <span className="mx-2">|</span>
                    <a href="" className="hover:underline">FAQ</a>
                </p>

                <p className="hidden dark:block text-center text-xs text-white">
                    &copy; 2023 iPaha Portfolio, Inc. All rights reserved.
                </p>

                <p className="hidden dark:block text-center text-xs text-white">
                    <a href="" className="hover:underline">Privacy</a>
                    <span className="mx-2">|</span>
                    <a href="" className="hover:underline">Terms</a>
                    <span className="mx-2">|</span>
                    <a href="" className="hover:underline">FAQ</a>
                </p>

                <motion.div 
                whileHover={{ scale: 1.5 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 10 }}
                >
                <p className="flex items-center gap-2 ml-4 justify-center mt-4" >
                    <a href=""><LinkedInLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></a>
                    <a href=""><InstagramLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></a>
                    <a href=""><TwitterLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></a>
                    <a href=""><GitHubLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></a>
                </p>
            
            </motion.div>

            </div>
        </footer>
        </div>
    )
}

export default Footer;