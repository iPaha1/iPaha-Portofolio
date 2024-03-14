"use client";

import DownloadCV from "@/components/download-cv";
import ScrollVelocity from "@/components/scroll-velocity";
import EducationTypeWriting from "@/components/typewriting/education-typewriting";
import ExperienceTypeWriting from "@/components/typewriting/experience-typewriting";
import SkillsTypeWriting from "@/components/typewriting/skill-typewriting";
import { motion } from "framer-motion";
import { ArrowDownCircle } from "lucide-react";
import { useEffect, useState } from "react";


const ExperienceAndSkillsPage = () => {

    const [showExperienceTypeWriting, setShowExperienceTypeWriting] = useState(false);
    const [showEducationTypeWriting, setShowEducationTypeWriting] = useState(false);

    useEffect(() => {
        // Set a timer to update the state after 3 minutes
        const timer = setTimeout(() => {
            setShowExperienceTypeWriting(true);
        }, 300); // 3 minutes in milliseconds

        // Cleanup the timer
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Set a timer to update the state after 3 minutes
        const timer = setTimeout(() => {
            setShowEducationTypeWriting(true);
        }, 600); // 3 minutes in milliseconds

        // Cleanup the timer
        return () => clearTimeout(timer);
    }, []);

    return ( 
        <div className="flex flex-col items-center justify-center p-8">
            <div className="text-5xl font-black">
                Education
            </div>
            {showEducationTypeWriting && (
                <div className="mt-10">
                    <EducationTypeWriting />
                </div>
            )}

            <div className="text-5xl font-black mt-10">
                Experience
            </div>

            {showExperienceTypeWriting && (
                <div>
                    <ExperienceTypeWriting />
                </div>
            )}

            <div className="text-5xl font-black mt-10 ">
                Skills
            </div>
            <SkillsTypeWriting />
            <div className="mt-10">
            <ScrollVelocity />
            </div>
            

            {/* <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 200 }}
                className="mt-10"
                >
                    
                    <div >
                    <ScrollVelocity />
                </div>
            </motion.div> */}
            
            <div className="flex flex-row text-lg mt-60">
                <ArrowDownCircle className="animate-bounce size-20" />
            </div>
            <div>
            
                <DownloadCV />
            </div>
        </div>
     );
}
 
export default ExperienceAndSkillsPage;