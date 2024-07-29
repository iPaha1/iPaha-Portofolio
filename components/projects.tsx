"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';

const ProjectsSection = () => {
  const projects = [
    {
      id: 'multi-functional-ecommerce-dashboard',
      title: "Multi-Functional E-Commerce Website Dashboard",
      description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
      image: "/images/background1.jpeg"
    },
    {
      id: 'ecommerce-store-website',
      title: "E-Commerce Store Website",
      description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
      image: "/images/background1.jpeg"
    },
  ];

  return (
    <section id="projects" className="py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-4xl font-bold mb-12 text-center text-black dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          My Projects
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div 
              key={project.id}
              className="p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <Image 
                src={project.image} 
                alt={project.title} 
                width={500}
                height={300}
                className="w-full h-48 object-cover mb-4 rounded-md" 
              />
              <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">{project.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{project.description}</p>
              <Link href={`/projects/${project.id}`} className="inline-flex items-center text-black dark:text-white hover:underline">
                <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                View Project <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;


// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import { ArrowUpRight } from 'lucide-react';
// import Link from 'next/link';
// import Image from 'next/image';

// const ProjectsSection = () => {
//   const projects = [
//     {
//       id: 'multi-functional-ecommerce-dashboard',
//       title: "Multi-Functional E-Commerce Website Dashboard",
//       description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//       image: "/images/ecommerce-dashboard.jpg" // Add an image for each project
//     },
//     {
//       id: 'ecommerce-store-website',
//       title: "E-Commerce Store Website",
//       description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//       image: "/images/ecommerce-store.jpg"
//     },
//   ];

//   return (
//     <section id="projects" className="py-20 bg-white dark:bg-black">
//       <div className="container mx-auto px-4">
//         <motion.h2 
//           className="text-4xl font-bold mb-12 text-center text-black dark:text-white"
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           My Projects
//         </motion.h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {projects.map((project, index) => (
//             <motion.div 
//               key={project.id}
//               className="p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: index * 0.1 }}
//               whileHover={{ scale: 1.03 }}
//             >
//               <Image 
//                 src={project.image} 
//                 alt={project.title} 
//                 width={500}
//                 height={300}
//                 className="w-full h-48 object-cover mb-4 rounded-md" 
//               />
//               <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">{project.title}</h3>
//               <p className="text-gray-700 dark:text-gray-300 mb-4">{project.description}</p>
//               <Link href={`/projects/${project.id}`} className="inline-flex items-center text-black dark:text-white hover:underline">
//                 View Project <ArrowUpRight className="ml-2 h-4 w-4" />
//               </Link>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ProjectsSection;


// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import { ArrowUpRight } from 'lucide-react';

// const ProjectsSection = () => {
//   const projects = [
//     // {
//     //   title: "Learning Management System",
//     //   description: "Developed an intuitive LMS using JavaScript, React, and Node.js, focused on enhancing the educational experience for both teachers and students.",
//     //   link: "#" // Replace with actual link
//     // },
//     // {
//     //   title: "AI SaaS Platform",
//     //   description: "Created an AI-driven SaaS website, demonstrating my ability to integrate cutting-edge AI technologies for innovative solutions.",
//     //   link: "#" // Replace with actual link
//     // },
//     {
//       title: "Multi-Functional E-Commerce Website Dashboard",
//       description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//       link: "#" // Replace with actual link
//     },
//     {
//       title: "E-Commerce Store Website ",
//       description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//       link: "#" // Replace with actual link
//     },
//     // {
//     //   title: "Event Management and Booking System",
//     //   description: "Engineered a user-centric event management website with backend functionalities, improving my skills in database management and UI design.",
//     //   link: "#" // Replace with actual link
//     // },
//     // {
//     //   title: "Python Projects",
//     //   description: "Ventured into diverse applications using Python, from data analysis to automation, reflecting my versatility and commitment to learning new technologies.",
//     //   link: "#" // Replace with actual link
//     // }
//   ];

//   return (
//     <section id="projects" className="py-20 bg-white dark:bg-black">
//       <div className="container mx-auto px-4">
//         <motion.h2 
//           className="text-4xl font-bold mb-12 text-center text-black dark:text-white"
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           My Projects
//         </motion.h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {projects.map((project, index) => (
//             <motion.div 
//               key={index}
//               className="p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: index * 0.1 }}
//               whileHover={{ scale: 1.05 }}
//             >
//               <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">{project.title}</h3>
//               <p className="text-gray-700 dark:text-gray-300 mb-4">{project.description}</p>
//               <a 
//                 href={project.link} 
//                 className="inline-flex items-center text-black dark:text-white hover:underline"
//               >
//                 View Project <ArrowUpRight className="ml-2 h-4 w-4" />
//               </a>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ProjectsSection;