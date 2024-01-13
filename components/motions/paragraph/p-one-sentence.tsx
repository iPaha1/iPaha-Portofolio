"use client"

import { ReactNode } from 'react';
import {motion, transform, useAnimationControls} from 'framer-motion';

const ParagraphOneSpan = ({ children }: { children: ReactNode }) => {

    const controls = useAnimationControls();

    const rubberBand = () => {
        return {
            x: [0, 100, -100, 100, -100, 100, -100, 0],
            y: [0, -100, 100, -100, 100, -100, 100, 0],
            transition: {
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.99, 1],
                loop: Infinity,
                repeatDelay: 1
            }
        }
    }

    const rubberBand2 = () => {
        controls.start({
            transform: [
                "scale3d(1, 1, 1)",
                "scale3d(1.4, 0.55, 1)",
                "scale3d(0.75, 1.25, 1)",
                "scale3d(1.25, 0.85, 1)",
                "scale3d(0.95, 1.05, 1)",
                "scale3d(1.05, 0.95, 1)",
                "scale3d(1, 1, 1)",
        
            ],
            transition: {
                duration: 1,
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.99, 1],
                loop: Infinity,
                repeatDelay: 1
            }
        })
            
        }
       

    

    
    return ( 
        <div className="hidden md:flex flex-row">
            <motion.span 
                animate={controls}
                onMouseOver={rubberBand2}
            >
                {children}
            </motion.span>
        </div>
     );
}
 
export default ParagraphOneSpan;