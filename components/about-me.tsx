"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Code, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutSection = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const certifications = [
    { title: "Google IT Professional", icon: BookOpen },
    { title: "Cisco Certified Support Technician", icon: Shield },
    { title: "Cisco Networking Essential", icon: Code }
  ];

  return (
    <section id="about" className="py-20 px-4 md:px-8 max-w-6xl mx-auto ">
      <motion.h2 
        className="text-5xl font-bold mb-12 text-center bg-clip-text "
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        About Me
      </motion.h2>
      
      <motion.div 
        className="space-y-12"
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
      >
        <motion.p className="text-xl leading-relaxed" variants={fadeIn}>
          My journey in computing and IT has been more than just acquiring degrees; it&apos;s been a journey of constant learning, skill development, and applying these in practical scenarios. Here&apos;s how I&apos;ve grown academically and professionally:
        </motion.p>

        <motion.div 
          className="bg-white dark:bg-black p-8 rounded-xl shadow-lg border border-amber-500 dark:border-amber-500"
          variants={fadeIn}
        >
          <h3 className="text-3xl font-thin mb-6 ">BSc Hons. Computing and IT (2021 - Present)</h3>
          <p className="text-lg mb-4">At the Open University London, I&apos;ve not only learned the theoretical aspects of computing but also developed a robust practical skill set.</p>
          <ul className="list-none mt-4 space-y-3">
            {['Mastered programming languages and software development life cycle.',
              'Engaged in hands-on projects, applying concepts in real-world scenarios.',
              'Developed strong problem-solving and analytical skills.'].map((item, index) => (
              <motion.li 
                key={index}
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ArrowRight className="h-5 w-5 text-amber-500" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.p className="text-xl leading-relaxed" variants={fadeIn}>
          As a dynamic self-learner and a student at the Open University London, I&apos;ve consistently sought to expand my knowledge and skills in the tech industry. My approach combines theoretical understanding with practical application, allowing me to adapt quickly to new technologies and methodologies.
        </motion.p>

        <motion.div 
          className="bg-gradient-to-r  p-1 rounded-xl shadow-lg"
          variants={fadeIn}
        >
          <div className="bg-white dark:bg-black border border-amber-500 dark:border-amber-500 p-7 rounded-lg">
            <h3 className="text-3xl font-thin mb-6 bg-clip-text ">Key Skills and Competencies</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Proficient in JavaScript, React, Node.js, and Python',
                'Experience with database management and UI design',
                'Strong foundation in software development principles and best practices',
                'Ability to quickly learn and implement new technologies',
                'Effective problem-solving and analytical thinking skills'].map((skill, index) => (
                <motion.li 
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Code className="h-5 w-5 text-amber-500" />
                  <span>{skill}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div variants={fadeIn}>
          <h3 className="text-2xl font-thin mb-6 text-center">2023 Certifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <motion.div 
                key={index}
                className="border border-amber-500 dark:border-amber-500 bg-white dark:bg-black p-6 rounded-lg shadow-md text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <cert.icon className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h4 className="font-semibold">{cert.title}</h4>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p className="text-xl leading-relaxed" variants={fadeIn}>
          Each step in my academic journey has been about more than just learning; it&apos;s been about growing as a technologist. Balancing academics with practical skill development, I&apos;ve learned the importance of adaptability, continuous learning, and applying theory to practice in a rapidly evolving tech world. Ready for collaboration, I&apos;m excited to transform ideas into impactful digital experiences.
        </motion.p>

        <motion.div 
          className="text-center mt-12"
          variants={fadeIn}
        >
          <Link href="#projects">
            <Button className="border border-amber-500 dark:border-amber-500 hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white text-white dark:text-black transition-all duration-300 transform hover:scale-105" size="lg">
              View My Projects
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutSection;


// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import Link from 'next/link';
// import { ArrowRight } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// const AboutSection = () => {
//   const fadeIn = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
//   };

//   return (
//     <section id="about" className="py-20 px-4 md:px-8 max-w-6xl mx-auto bg-white dark:bg-black text-black dark:text-white">
//       <motion.h2 
//         className="text-4xl font-bold mb-8 text-center"
//         initial="hidden"
//         animate="visible"
//         variants={fadeIn}
//       >
//         About Me
//       </motion.h2>
      
//       <motion.div 
//         className="space-y-8"
//         initial="hidden"
//         animate="visible"
//         variants={fadeIn}
//       >
//         <p className="text-lg">
//           My journey in computing and IT has been more than just acquiring degrees; it&apos;s been a journey of constant learning, skill development, and applying these in practical scenarios. Here&apos;s how I&apos;ve grown academically and professionally:
//         </p>

//         <div className=" p-6 rounded-lg border border-gray-200 dark:border-gray-700">
//           <h3 className="text-2xl font-semibold mb-4">BSc Hons. Computing and IT (2021 - Present)</h3>
//           <p>At the Open University London, I&apos;ve not only learned the theoretical aspects of computing but also developed a robust practical skill set.</p>
//           <ul className="list-disc list-inside mt-4 space-y-2">
//             <li>Mastered programming languages and software development life cycle.</li>
//             <li>Engaged in hands-on projects, applying concepts in real-world scenarios.</li>
//             <li>Developed strong problem-solving and analytical skills.</li>
//           </ul>
//         </div>

//         <p className="text-lg">
//           As a dynamic self-learner and a student at the Open University London, I&apos;ve consistently sought to expand my knowledge and skills in the tech industry. My approach combines theoretical understanding with practical application, allowing me to adapt quickly to new technologies and methodologies.
//         </p>

//         <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
//           <h3 className="text-2xl font-semibold mb-4">Key Skills and Competencies</h3>
//           <ul className="list-disc list-inside space-y-2">
//             <li>Proficient in JavaScript, React, Node.js, and Python</li>
//             <li>Experience with database management and UI design</li>
//             <li>Strong foundation in software development principles and best practices</li>
//             <li>Ability to quickly learn and implement new technologies</li>
//             <li>Effective problem-solving and analytical thinking skills</li>
//           </ul>
//         </div>

//         <p className="text-lg">
//           In 2023, I focused on diversifying and certifying my skills:
//         </p>
//         <ul className="list-disc list-inside space-y-2">
//           <li>Google IT Professional: Enhanced my understanding of network protocols, cloud computing, and security fundamentals.</li>
//           <li>Cisco Certified Support Technician: Gained insights into network setup, management, and troubleshooting.</li>
//           <li>Cisco Networking Essential: Strengthened my networking concepts, preparing me for complex network solutions.</li>
//         </ul>

//         <p className="text-lg">
//           Each step in my academic journey has been about more than just learning; it&apos;s been about growing as a technologist. Balancing academics with practical skill development, I&apos;ve learned the importance of adaptability, continuous learning, and applying theory to practice in a rapidly evolving tech world. Ready for collaboration, I&apos;m excited to transform ideas into impactful digital experiences.
//         </p>

//         <div className="text-center mt-8">
//           <Link href="#projects">
//             <Button className="group bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" size="lg">
//               View My Projects
//               <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//             </Button>
//           </Link>
//         </div>
//       </motion.div>
//     </section>
//   );
// };

// export default AboutSection;



// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import Link from 'next/link';
// import { ArrowRight } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// const AboutSection = () => {
//   const fadeIn = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
//   };

//   return (
//     <section id="about" className="py-20 px-4 md:px-8 max-w-6xl mx-auto bg-white dark:bg-black text-black dark:text-white">
//       <motion.h2 
//         className="text-4xl font-bold mb-8 text-center"
//         initial="hidden"
//         animate="visible"
//         variants={fadeIn}
//       >
//         About Me
//       </motion.h2>
      
//       <motion.div 
//         className="space-y-8"
//         initial="hidden"
//         animate="visible"
//         variants={fadeIn}
//       >
//         <p className="text-lg">
//           My journey in computing and IT has been more than just acquiring degrees; it&apos;s been a journey of constant learning, skill development, and applying these in practical scenarios. Here&apos;s how I&apos;ve grown academically and professionally:
//         </p>

//         <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
//           <h3 className="text-2xl font-semibold mb-4">BSc Hons. Computing and IT (2021 - Present)</h3>
//           <p>At the Open University London, I&apos;ve not only learned the theoretical aspects of computing but also developed a robust practical skill set.</p>
//           <ul className="list-disc list-inside mt-4 space-y-2">
//             <li>Mastered programming languages and software development life cycle.</li>
//             <li>Engaged in hands-on projects, applying concepts in real-world scenarios.</li>
//             <li>Developed a Learning Management System using JavaScript, React, and Node.js.</li>
//           </ul>
//         </div>

//         <p className="text-lg">
//           As a dynamic self-learner and a student at the Open University London, I&apos;ve built a diverse portfolio of software development projects, showcasing my proficiency and adaptability in the tech industry.
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {[
//             "Learning Management System: Developed an intuitive LMS using JavaScript, React, and Node.js, focused on enhancing the educational experience for both teachers and students.",
//             "AI SaaS Platform: Created an AI-driven SaaS website, demonstrating my ability to integrate cutting-edge AI technologies for innovative solutions.",
//             "E-Commerce Website with Admin Dashboard: Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//             "Event Management and Booking System: Engineered a user-centric event management website with backend functionalities, improving my skills in database management and UI design.",
//             "Python Projects: Ventured into diverse applications using Python, from data analysis to automation, reflecting my versatility and commitment to learning new technologies."
//           ].map((project, index) => (
//             <motion.div 
//               key={index} 
//               className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-800"
//               whileHover={{ scale: 1.05 }}
//               transition={{ type: "spring", stiffness: 300 }}
//             >
//               <p>{project}</p>
//             </motion.div>
//           ))}
//         </div>

//         <p className="text-lg">
//           In 2023, I focused on diversifying and certifying my skills:
//         </p>
//         <ul className="list-disc list-inside space-y-2">
//           <li>Google IT Professional: Enhanced my understanding of network protocols, cloud computing, and security fundamentals.</li>
//           <li>Cisco Certified Support Technician: Gained insights into network setup, management, and troubleshooting.</li>
//           <li>Cisco Networking Essential: Strengthened my networking concepts, preparing me for complex network solutions.</li>
//         </ul>

//         <p className="text-lg">
//           Each step in my academic journey has been about more than just learning; it&apos;s been about growing as a technologist. Balancing academics with project work, I&apos;ve learned the importance of adaptability, continuous learning, and applying theory to practice in a rapidly evolving tech world. Ready for collaboration, I&apos;m excited to transform ideas into impactful digital experiences.
//         </p>

//         <div className="text-center mt-8">
//           <Link href="#projects">
//             <Button className="group bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" size="lg">
//               View My Projects
//               <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//             </Button>
//           </Link>
//         </div>
//       </motion.div>
//     </section>
//   );
// };

// export default AboutSection;

// const AboutSection = () => {
//     return (
//       <section id="about" className="py-20">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold mb-8">About Me</h2>
//           <p className="text-lg">
//             Here you can add information about yourself, your background, and your passion for software engineering.
//           </p>
//         </div>
//       </section>
//     );
//   };
  
//   export default AboutSection;