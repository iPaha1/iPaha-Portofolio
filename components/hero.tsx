"use client"

import React from "react";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import TextSpan from "./text-span";
import ParagraphSpan from "./motions/paragraph/p-one-sentence";
import { motion } from "framer-motion";
import DownloadCV from "./download-cv";
import App from "./motions/birds-flying-motion";
import BirdsFlyingApp from "./motions/birds-flying-motion-dark";
import { ArrowDownCircle } from "lucide-react";


const HeroPage = () => {

  const mobileSentenceHeader = "New Welcome to My World of Innovation".split("");

  const mobileSentence = "New I am a software engineer, and I turn ideas into reality with code. I build solutions that make a difference, crafting digital experiences that empower businesses and delight users. Whether it&apos;s creating web applications, solving complex problems, or embracing cutting-edge technologies, I thrive on challenges and am driven by a passion for innovation. Explore my journey, projects, and skills as I embark on a continuous quest for excellence in the ever-evolving world of technology.".split("");

  const profilePicture = "/images/photo1.png";

  const sentence = "Welcome to My World of Innovation".split("");

  const pOneSentence = "I am a software engineer, and I turn ideas into reality with code. I build solutions that make a difference,".split("");
  
  const pTwoSentence = "crafting digital expirences that empower businesses and delight users. Whether it&apos;s creating web ".split("");

  const pThreeSentence = "applications, solving complex problems, or embracing cutting-edge technologies, I thrive on challenges ".split("");

  const pFourSentence = "and am driven by a passion for innovation Explore my journey, projects, and skills as I embark on a ".split("");

  const pFiveSentence = "continuous quest for excellence in the ever-evolving world of technology.".split("");
// <div className="absolute inset-40 z-[-1] h-full flex justify-center">
    return (
      <div className="min-h-screen flex flex-col gap-2 p-8 items-center justify-center">
        <div className="dark:hidden absolute inset-60 z-[-1] bottom-right right-0">
            <App />
        </div>

        <div className="hidden dark:block z-[-1] absolute inset-60 bottom-right right-0 ">
            <BirdsFlyingApp /> 
        </div>
        {/* <Skeleton className="h-12 w-12 rounded-full" /> */}
        <div className="space-y-4">
          
         
        <motion.div 
          whileHover={{ scale: 1.1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 10 }}
        >
        <Image 
          src="/images/photo1.png" 
          alt="Picture of the author" 
          width={70} height={50} 
          className="transition-transform transform hover:scale-150 rounded-md mt-40" 
        />

        <div>
          <h1 className="md:hidden text-5xl font-bold">Welcome to My World of Innovation</h1>
            <p className="md:hidden mt-5">
              I am a software engineer, and I turn ideas into reality with code. I build solutions that make a difference, 
              crafting digital experiences that empower businesses and delight users. Whether it&apos;s creating web applications, 
              solving complex problems, or embracing cutting-edge technologies, I thrive on challenges and am driven by a passion for 
              innovation. Explore my journey, projects, and skills as I embark on a continuous quest for excellence in the ever-evolving 
              world of technology.
            </p>
        </div>


        <div className="flex flex-row text-5xl font-bold mt-4">
            {sentence.map((letter, index) => {
              return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
              );
            })}
          </div>
          <div className="flex flex-row text-lg mt-10">
            {pOneSentence.map((letter, index) => {
              return (<ParagraphSpan key={index} >{letter === " " ? "\u00A0" : letter}</ParagraphSpan>
              );
            })
            }
          
          </div>
          <div className="flex flex-row text-lg">
            {pTwoSentence.map((letter, index) => {
              return (<ParagraphSpan key={index} >{letter === " " ? "\u00A0" : letter}</ParagraphSpan>
              );
            })
            }
          </div>
          <div className="flex flex-row text-lg">
            {pThreeSentence.map((letter, index) => {
              return (<ParagraphSpan key={index} >{letter === " " ? "\u00A0" : letter}</ParagraphSpan>
              );
            })
            }
          </div>

          <div className="flex flex-row text-lg">
            {pFourSentence.map((letter, index) => {
              return (<ParagraphSpan key={index} >{letter === " " ? "\u00A0" : letter}</ParagraphSpan>
              );
            })
            }
          </div>
          <div className="flex flex-row text-lg">
            {pFiveSentence.map((letter, index) => {
              return (<ParagraphSpan key={index} >{letter === " " ? "\u00A0" : letter}</ParagraphSpan>
              );
            })
            }
          </div>
        
        </motion.div>

        

          
          
          
        </div>
        <div className="flex flex-row text-lg mt-60">
          <ArrowDownCircle className="animate-bounce size-20" />
        </div>
        <div>
        
          
          <DownloadCV />
        </div>
        
      </div>
    );
  };
  
  export default HeroPage;
  