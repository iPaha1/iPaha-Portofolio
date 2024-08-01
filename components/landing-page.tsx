"use client";

import React from 'react';
import Image from "next/image";
import { motion } from 'framer-motion';
import { ArrowRight, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextSpan from "./text-span";
import ParagraphSpan from "./motions/paragraph/p-one-sentence";
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

const LandingPage = () => {
  const sentence = "Welcome to My World of Innovation".split("");
  const pOneSentence = "Passionate about creating beautiful, functional, and".split("");
  const pTwoSentence = "user-centered digital experiences. With a strong".split("");
  const pThreeSentence = "foundation in both front-end and back-end development.".split("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white relative overflow-hidden">
    
      <motion.div 
        className="text-center p-8 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Image
            src="/images/photo1.png"
            alt="Picture of the author"
            width={100}
            height={100}
            className="rounded-full mx-auto mb-8 transition-transform transform hover:scale-110 grayscale"
          />
        </motion.div>

        <motion.div
          className="mb-8"
          variants={itemVariants}
        >

        <div>
          <h1 className="md:hidden text-xl font-bold">Welcome to My World of Innovation</h1>
            <p className="md:hidden mt-5">
              Passionate about creating beautiful, functional, and user-centered digital experiences. With a strong foundation in both front-end and back-end development
            </p>
        </div>
          <div className="flex flex-wrap justify-center text-4xl md:text-5xl font-bold mb-4">
            {sentence.map((letter, index) => (
              <TextSpan key={index}>{letter === " " ? "\u00A0" : letter}</TextSpan>
            ))}
          </div>
          <div className="text-xl font-thin">
            {[pOneSentence, pTwoSentence, pThreeSentence].map((sentence, sentenceIndex) => (
              <div key={sentenceIndex} className="flex flex-wrap justify-center">
                {sentence.map((letter, letterIndex) => (
                  <ParagraphSpan key={`${sentenceIndex}-${letterIndex}`}>
                    {letter === " " ? "\u00A0" : letter}
                  </ParagraphSpan>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
        {/* <a href={project.liveLink} target="_blank" rel="noopener noreferrer"></a> */}

        <motion.div 
          className="flex justify-center space-x-4 mb-8"
          variants={itemVariants}
        >
          <a href="https://github.com/iPaha1" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="icon" className="border border-amber-500 dark:border-amber-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
            <GitHubLogoIcon className="h-5 w-5" />
          </Button>
          </a>
          <a href="https://www.linkedin.com/in/isaac-paha-578911a9/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="icon" className="border border-amber-500 dark:border-amber-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
            <Linkedin className="h-5 w-5" />
          </Button>
          </a>
          <Link href="mailto:pahaisaac@gmail.com" passHref>
          <Button variant="outline" size="icon" className="border border-amber-500 dark:border-amber-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
            <Mail className="h-5 w-5" />
          </Button>
          </Link>
        </motion.div>
        
        <motion.div variants={itemVariants}>
            <Link href="#projects" passHref>
          <Button className="group bg-black dark:bg-white text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white border  border-amber-500  transition-colors" size="lg">
            View My Work
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
            </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;


// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import { ArrowRight, Linkedin, Mail } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { GitHubLogoIcon } from '@radix-ui/react-icons';

// const LandingPage = () => {
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: { 
//       opacity: 1,
//       transition: { staggerChildren: 0.1 }
//     }
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: { 
//       y: 0, 
//       opacity: 1,
//       transition: { type: 'spring', stiffness: 100 }
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
//       <motion.div 
//         className="text-center p-8"
//         variants={containerVariants}
//         initial="hidden"
//         animate="visible"
//       >
//         <motion.h1 
//           className="text-5xl font-bold mb-4 text-gray-800 dark:text-white"
//           variants={itemVariants}
//         >
//           John Doe
//         </motion.h1>
//         <motion.h2 
//           className="text-3xl mb-6 text-gray-600 dark:text-gray-300"
//           variants={itemVariants}
//         >
//           Full Stack Developer
//         </motion.h2>
//         <motion.p 
//           className="text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
//           variants={itemVariants}
//         >
//           Passionate about creating beautiful, functional, and user-centered digital experiences. 
//           With a strong foundation in both front-end and back-end development.
//         </motion.p>
//         <motion.div 
//           className="flex justify-center space-x-4 mb-8"
//           variants={itemVariants}
//         >
//           <Button variant="outline" size="icon">
//             <GitHubLogoIcon className="h-5 w-5" />
//           </Button>
//           <Button variant="outline" size="icon">
//             <Linkedin className="h-5 w-5" />
//           </Button>
//           <Button variant="outline" size="icon">
//             <Mail className="h-5 w-5" />
//           </Button>
//         </motion.div>
//         <motion.div variants={itemVariants}>
//           <Button className="group" size="lg">
//             View My Work
//             <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//           </Button>
//         </motion.div>
//       </motion.div>
//     </div>
//   );
// };

// export default LandingPage;