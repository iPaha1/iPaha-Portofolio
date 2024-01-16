"use client";

// import "./styles.css";
import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame
} from "framer-motion";
import { wrap } from "@motionone/utils";
import { DotIcon } from "lucide-react";


interface ParallaxProps {
  // children: string;
  children: React.ReactNode;
  baseVelocity: number;
}

function ParallaxText({ children, baseVelocity = 100 }: ParallaxProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false
  });

  /**
   * This is a magic wrapping for the length of the text - you
   * have to replace for wrapping that works for you or dynamically
   * calculate
   */
  const x = useTransform(baseX, (v) => `${wrap(-100, 100, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    /**
     * This is what changes the direction of the scroll once we
     * switch scrolling directions.
     */
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });

  /**
   * The number of times to repeat the child text should be dynamically calculated
   * based on the size of the text and viewport. Likewise, the x motion value is
   * currently wrapped between -20 and -45% - this 25% is derived from the fact
   * we have four children (100% / 4). This would also want deriving from the
   * dynamically generated number of children.
   */
  return (
    <div className="parallax">
      <motion.div className="scroller" style={{ x }}>
        <span>{children} </span>
        {/* <span>{children} </span>
        <span>{children} </span>
        <span>{children} </span> */}
      </motion.div>
    </div>
  );
}

const words = [
    <div key="next-js" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">•Next JS </div>, 
    <div key="react-js" className="flex flex-row justify-center items-center text-5xl font-black ">  •React JS  </div>, 
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black "> •React Native  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-7xl font-black ">  •Node JS  </div>, 
    <div key="software-management" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Software Managment  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Express JS  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Mongo DB  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl font-black ">  •PostgreSQL  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Typescript  </div>,

];

const words2 = [
    <div key="javascript" className="flex flex-row justify-center items-center text-7xl  font-black ">  •Javascript </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •HTML </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-7xl  font-black "> •CSS </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Tailwind </div>,
    <div key="system-administration" className="flex flex-row justify-center items-center text-7xl  font-black ">   •System Administration </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-5xl  font-black ">   •Boostrap </div>,
];

const words3 = [
    <div key="material-ui" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Material UI   </div>,
    <div key="material-ui" className="flex flex-row justify-center items-center text-5xl  font-black ">  •Framer Motion   </div>,
    <div key="material-ui" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •React Router   </div>,
    <div key="material-ui" className="flex flex-row justify-center items-center text-5xl  font-black ">   •React Query  </div>,
    <div key="troubleshooting" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Troubleshooting  </div>,
    
];

const words4 = [
    <div key="next-auth" className="flex flex-row justify-center items-center text-7xl  font-black ">•Shadcn UI </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Next SEO  </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-7xl  font-black ">  •Next Auth  </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Python  </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-5xl  font-black ">  •Next Link  </div>,
    <div key="customer-service" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Customer Service  </div>,
    
];

const word5 = [
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">•Next JS </div>, 
    <div key="react-js" className="flex flex-row justify-center items-center text-7xl font-black ">  •React JS  </div>, 
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black "> •React Native  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl font-black ">  •Node JS  </div>, 
    <div key="next-js" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Express JS  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Mongo DB  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-7xl font-black ">  •PostgreSQL  </div>,
    <div key="next-js" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Typescript  </div>,

];

const words6 = [
    <div key="javascript" className="flex flex-row justify-center items-center text-5xl  font-black ">  •Javascript </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •HTML </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-5xl  font-black "> •CSS </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •Tailwind </div>,
    <div key="networking" className="flex flex-row justify-center items-center text-5xl  font-black ">   •Networking </div>,
    <div key="javascript" className="flex flex-row justify-center items-center text-5xl  font-black ">   •Boostrap </div>,
];

const words7 = [
    <div key="material-ui" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Material UI   </div>,
    <div key="material-ui" className="flex flex-row justify-center items-center text-5xl  font-black ">  •Framer Motion   </div>,
    <div key="material-ui" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •React Router   </div>,
    <div key="material-ui" className="flex flex-row justify-center items-center text-5xl  font-black ">   •React Query  </div>,
    
];

const words8 = [
    <div key="next-auth" className="flex flex-row justify-center items-center text-7xl  font-black ">•Shadcn UI </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Java </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-7xl  font-black ">  •Prisma DB  </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-5xl text-muted-foreground font-black ">  •Next Image  </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-5xl  font-black ">  •Next Link  </div>,
    <div key="next-auth" className="flex flex-row justify-center items-center text-7xl text-muted-foreground font-black ">  •MYSQL  </div>,
    
];

// combine the words into one array
const firstline = [...words, ...words2];
const secondline = [...words3, ...words4];
const thirdline = [...word5, ...words6];
const fourthline = [...words7, ...words8];

export default function ScrollVelocity() {
  return (
    <section>
        {/* Render the first line */}
      <ParallaxText key="line1" baseVelocity={10}>
        <div className="flex flex-row justify-center items-center">
          {firstline.map((word, index) => (
            <React.Fragment key={index}>{word}</React.Fragment>
          ))}
        </div>
      </ParallaxText>

      {/* Render the second line */}
      <ParallaxText key="line2" baseVelocity={-10}>
        <div className="flex flex-row justify-center items-center">
          {secondline.map((word, index) => (
            <React.Fragment key={index}>{word}</React.Fragment>
          ))}
        </div>
      </ParallaxText>
          
        {/* Render the third line */}
        <ParallaxText key="line3" baseVelocity={11}>
        <div className="flex flex-row justify-center items-center">
          {thirdline.map((word, index) => (
            <React.Fragment key={index}>{word}</React.Fragment>
          ))}
        </div>
        </ParallaxText>
            
            {/* Render the fourth line */}
            <ParallaxText key="line4" baseVelocity={-15}>
        <div className="flex flex-row justify-center items-center">
            {fourthline.map((word, index) => (
                <React.Fragment key={index}>{word}</React.Fragment>
            ))}
        </div>
            </ParallaxText>
      {/* <ParallaxText baseVelocity={-5}>Framer Motion . </ParallaxText>
      <ParallaxText baseVelocity={5}>Scroll velocity</ParallaxText>
      <ParallaxText baseVelocity={-5}>Framer Motion</ParallaxText>
      <ParallaxText baseVelocity={5}>Scroll velocity</ParallaxText> */}
      {/* {words.map((word, index) => (
        <ParallaxText key={index} baseVelocity={index % 2 === 0 ? 5 : 5}>
          {word}
        </ParallaxText>
      ))}
        {words2.map((word, index) => (
            <ParallaxText key={index} baseVelocity={index % 2 === 0 ? -5 : 5}>
            {word}
            </ParallaxText>
        ))}
        {words3.map((word, index) => (
            <ParallaxText key={index} baseVelocity={index % 2 === 0 ? 5 : 5}>
            {word}
            </ParallaxText>
        ))}

        {words4.map((word, index) => (
            <ParallaxText key={index} baseVelocity={index % 2 === 0 ? -5 : 5}>
            {word}
            </ParallaxText>
        ))} */}
        
            
    </section>
  );
}
