"use client"

import React from 'react';
import TextSpan from '@/components/text-span';

import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { Circle, X } from 'lucide-react';


function MotionPage() {
  const x = useMotionValue(0)
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["#ff008c", "#ffffff", "rgb(230, 255, 0)"]
  )
  const sentence = "Welcome to My World of Innovation".split(" ");
  return ( 
    <motion.div style={{ background }} className="flex flex-row items-center justify-center text-6xl font-bold ml-10 h-full">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x }}
      >
          <Circle x={x.get()} />
        
      </motion.div>
    {sentence.map((letter, index) => {
      return (<TextSpan key={index} >{letter}</TextSpan>
      );
    })}
  </motion.div>
   );
}
 
export default MotionPage;