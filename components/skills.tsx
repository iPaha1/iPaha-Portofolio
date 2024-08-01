"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Layout, Server, Database, Shield, Cpu } from 'lucide-react';

const SkillsSection = () => {
  const skillCategories = [
    {
      name: "Front-End Development",
      icon: <Layout className="w-8 h-8 mb-4" />,
      skills: ["JavaScript", "React JS", "HTML", "CSS", "Tailwind", "Framer Motion"]
    },
    {
      name: "Back-End Development",
      icon: <Server className="w-8 h-8 mb-4" />,
      skills: ["Python", "Node JS", "Next JS"]
    },
    {
      name: "Full-Stack",
      icon: <Code className="w-8 h-8 mb-4" />,
      skills: ["TypeScript", "React Router", "Next Auth", "Next SEO"]
    },
    {
      name: "Database",
      icon: <Database className="w-8 h-8 mb-4" />,
      skills: ["MongoDB", "MySQL", "PostgreSQL"]
    },
    {
      name: "DevOps & Tools",
      icon: <Cpu className="w-8 h-8 mb-4" />,
      skills: ["Git", "Docker", "CI/CD", "AWS"]
    },
    {
      name: "Certifications",
      icon: <Shield className="w-8 h-8 mb-4" />,
      skills: ["Google IT Professional", "Cisco Certified Support Technician", "Cisco Networking Essential"]
    }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="skills" className="py-20 ">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-5xl font-bold mb-12 text-center bg-clip-text "
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          My Skills
        </motion.h2>
        
        <motion.p 
          className="text-xl mb-16 text-center max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          As a versatile technologist, I excel in front-end and back-end development, with a focus on JavaScript and its frameworks. My expertise extends to crafting visually appealing interfaces and building robust server-side applications. I&apos;m constantly adapting to new technologies and ready to transform ideas into impactful digital experiences.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ">
          {skillCategories.map((category, index) => (
            <motion.div 
              key={index}
              className="bg-white dark:bg-black p-6 rounded-xl shadow-lg border border-amber-500 dark:border-amber-500 hover:shadow-xl transition-shadow duration-300"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex flex-col items-center mb-6">
                {category.icon}
                <h3 className="text-2xl font-semibold">{category.name}</h3>
              </div>
              <ul className="space-y-2">
                {category.skills.map((skill, skillIndex) => (
                  <motion.li 
                    key={skillIndex} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index * 0.1) + (skillIndex * 0.05) }}
                  >
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                    {skill}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;


// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import { Code, Layout, Server, Database, Shield, Cpu } from 'lucide-react';

// const SkillsSection = () => {
//   const skillCategories = [
//     {
//       name: "Front-End Development",
//       icon: <Layout className="w-6 h-6 mb-2" />,
//       skills: ["JavaScript", "React JS", "HTML", "CSS", "Tailwind", "Framer Motion"]
//     },
//     {
//       name: "Back-End Development",
//       icon: <Server className="w-6 h-6 mb-2" />,
//       skills: ["Python", "Node JS", "Next JS"]
//     },
//     {
//       name: "Full-Stack",
//       icon: <Code className="w-6 h-6 mb-2" />,
//       skills: ["TypeScript", "React Router", "Next Auth", "Next SEO"]
//     },
//     {
//       name: "Database",
//       icon: <Database className="w-6 h-6 mb-2" />,
//       skills: ["MongoDB", "MySQL", "PostgreSQL"]
//     },
//     {
//       name: "DevOps & Tools",
//       icon: <Cpu className="w-6 h-6 mb-2" />,
//       skills: ["Git", "Docker", "CI/CD", "AWS"]
//     },
//     {
//       name: "Certifications",
//       icon: <Shield className="w-6 h-6 mb-2" />,
//       skills: ["Google IT Professional", "Cisco Certified Support Technician", "Cisco Networking Essential"]
//     }
//   ];

//   const fadeInUp = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0 }
//   };

//   return (
//     <section id="skills" className="py-20 bg-white dark:bg-black text-black dark:text-white">
//       <div className="container mx-auto px-4">
//         <motion.h2 
//           className="text-4xl font-bold mb-12 text-center"
//           initial="hidden"
//           animate="visible"
//           variants={fadeInUp}
//         >
//           My Skills
//         </motion.h2>
        
//         <motion.p 
//           className="text-lg mb-12 text-center max-w-3xl mx-auto"
//           initial="hidden"
//           animate="visible"
//           variants={fadeInUp}
//         >
//           As a versatile technologist, I excel in front-end and back-end development, with a focus on JavaScript and its frameworks. My expertise extends to crafting visually appealing interfaces and building robust server-side applications. I&apos;m constantly adapting to new technologies and ready to transform ideas into impactful digital experiences.
//         </motion.p>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {skillCategories.map((category, index) => (
//             <motion.div 
//               key={index}
//               className=" dark:border p-6 rounded-lg shadow-md"
//               initial="hidden"
//               animate="visible"
//               variants={fadeInUp}
//               transition={{ delay: index * 0.1 }}
//             >
//               <div className="flex items-center justify-center mb-4">
//                 {category.icon}
//                 <h3 className="text-xl font-semibold ml-2">{category.name}</h3>
//               </div>
//               <ul className="list-disc list-inside">
//                 {category.skills.map((skill, skillIndex) => (
//                   <li key={skillIndex} className="mb-2">{skill}</li>
//                 ))}
//               </ul>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default SkillsSection;





// "use client"

// import React from "react";
// import { Button } from "@/components/ui/button"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/components/ui/tabs"


// const SkillsPage = () => {
//     return ( 
//         <div>
//           <div className="max-w-3xl space-y-4">
//             <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
//               Skills
//             </h1>
//           <p>
//             Skill in the IT industry is a broad term that refers to a person&apos;s knowledge, abilities, and expertise in a particular area.
//             But I believe that the most important skill is the ability to learn and adapt to new technologies. As an IT student with a strong 
//             passion for technology and a keen interest in computer science, I am eager to apply my knowledge and skills to real-world challenges and make a positive impact in the field. I am a quick learner and am always looking for opportunities to learn and grow, both in the classroom and through hands-on experience. I am a dedicated and hardworking individual with a strong work ethic and a commitment to excellence. I am confident that my skills and experience make me a strong candidate for any opportunity in the IT field.
//             Below are some of the skills I have acquired over the years.
//             I am always learning new skills and technologies to keep up with the ever-changing world of technology.
//           </p>
//           <div>
//           <Tabs defaultValue="skills" className="w-[800px] sm:flex flex-col">
//             <TabsList className="grid w-full grid-cols-3">
//               <TabsTrigger value="skills">Skills</TabsTrigger>
//               <TabsTrigger value="experience">Experience</TabsTrigger>
//               <TabsTrigger value="education">Education & Certifications</TabsTrigger>
//             </TabsList>
//             <TabsContent value="skills">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Software Management</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>System Administration</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>Troubleshooting</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>Customer Service</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>And More ...</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                 </CardHeader>
                
//                 <CardFooter>
//                   <Button>Go to Skills Page</Button>
//                 </CardFooter>
//               </Card>
//             </TabsContent>

//             <TabsContent value="experience">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>The Open University</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>System Administration</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>Troubleshooting</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>Customer Service</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>And More ...</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                 </CardHeader>
                
//                 <CardFooter>
//                   <Button>Go to Experience Page</Button>
//                 </CardFooter>
//               </Card>
//             </TabsContent>


//             <TabsContent value="education">
//               <Card>
//                 <CardHeader>
//                   <CardTitle> Degree </CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>System Administration</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>Troubleshooting</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>Customer Service</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                   <CardTitle>And More ...</CardTitle>
//                   <CardDescription>
//                       Make changes to your account here. Click save when you&apos;re done.
//                   </CardDescription>
//                 </CardHeader>
                
//                 <CardFooter>
//                   <Button>Go to Education & Certification Page</Button>
//                 </CardFooter>
//               </Card>
//             </TabsContent>
//           </Tabs>

//           </div>
//         </div>
//         </div>
//      );
// }
 
// export default SkillsPage;