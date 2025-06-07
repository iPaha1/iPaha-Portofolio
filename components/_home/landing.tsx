"use client";

import React from 'react';
import Image from "next/image";
import { motion, useAnimationControls } from 'framer-motion';
import { 
  ArrowRight, 
  Linkedin, 
  Mail, 
  Globe, 
  Code, 
  MapPin,
  GraduationCap,
  Building,
  Users,
  Rocket,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GitHub } from '@mui/icons-material';

// Enhanced TextSpan component with improved animations
const TextSpan = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const controls = useAnimationControls();

  const rubberBand = () => {
    controls.start({
      transform: [
        "scale3d(1, 1, 1)",
        "scale3d(1.3, 0.7, 1)",
        "scale3d(0.8, 1.2, 1)",
        "scale3d(1.1, 0.9, 1)",
        "scale3d(1, 1, 1)",
      ],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        times: [0, 0.3, 0.5, 0.8, 1],
      }
    });
  };

  return (
    <motion.span 
      onMouseOver={rubberBand}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="inline-block cursor-pointer hover:text-amber-600 transition-colors duration-300"
    >
      {children}
    </motion.span>
  );
};

// Company Card Component
type Company = {
  name: string;
  location: string;
  description: string;
  website: string;
};

interface CompanyCardProps {
  company: Company;
  delay?: number;
}

const CompanyCard = ({ company, delay = 0 }: CompanyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-gray-50/80 backdrop-blur-sm border border-amber-500/30 rounded-lg p-6 hover:border-amber-500/50 hover:bg-gray-100/50 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
          <Building className="w-4 h-4 text-black" />
        </div>
        <h3 className="text-lg font-semibold text-black">{company.name}</h3>
      </div>
      <p className="text-amber-400 text-sm mb-2">{company.location}</p>
      <p className="text-gray-600 text-sm mb-4">{company.description}</p>
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-amber-500" />
        <a 
          href={`https://${company.website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 text-sm transition-colors"
        >
          {company.website}
        </a>
      </div>
    </motion.div>
  );
};

// Tech Stack Badge Component
const TechBadge = ({ tech, delay = 0 }: { tech: string; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.1 }}
      className="bg-amber-100/50 border border-amber-500/40 rounded-md px-4 py-2 text-sm text-amber-700 hover:bg-amber-200/50 transition-all duration-300 cursor-default"
    >
      {tech}
    </motion.div>
  );
};

const LandingPage = () => {
  const heroTitle = "Isaac Paha".split("");
  const subtitle = "Full-Stack Developer & Tech Entrepreneur".split("");

  const companies = [
    {
      name: "iPaha Ltd",
      location: "🇬🇧 United Kingdom",
      description: "IT consultancy providing custom software and digital solutions",
      website: "ipahait.com"
    },
    {
      name: "iPahaStores Ltd",
      location: "🇬🇧 United Kingdom", 
      description: "Tech company offering SaaS and e-commerce solutions",
      website: "ipahastore.com"
    },
    {
      name: "Okpah Ltd",
      location: "🇬🇭 Ghana",
      description: "Innovation-driven startup building local digital platforms",
      website: "okpah.com"
    }
  ];

  const techStack = [
    "React.js", "Next.js", "TypeScript", "Node.js", "Tailwind CSS",
    "Prisma ORM", "MySQL", "Express.js", "Clerk", "Stripe"
  ];

  const products = [
    {
      name: "oKadwuma.com",
      description: "Job search platform connecting Ghanaian jobseekers and employers"
    },
    {
      name: "okDdwa.com", 
      description: "Multi-tenant e-commerce marketplace for local traders"
    },
    // Add more products as needed - Delievery app, location app, school management app, etc.
    {
        name: "okSumame.com",
        description: "Parcel delivery service connecting local couriers with customers"
    },
    {
        name: "okSika.com",
        description: "Payment gateway solution for online transactions"
    },
    {
        name: "okEdukation.com",
        description: "School management system for educational institutions"
    },
    {
        name: "Paralelme.com",
        description: "AI powered personal assistant and life coach"
    }

  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-400/5 to-transparent rounded-full"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div 
          className="text-center max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Profile Image */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-ful blur-lg opacity-20 animate-pulse"></div>
              <Image
                src="/images/photo1.png"
                alt="Isaac Paha - Full-Stack Developer & Tech Entrepreneur"
                width={120}
                height={120}
                className="relative rounded-md mx-auto border-2 border-amber-500/50 grayscale hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-md p-2">
                <Code className="w-4 h-4 text-black" />
              </div>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.div className="mb-6" variants={itemVariants}>
            <div className="flex flex-wrap justify-center text-4xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-gray-800 via-amber-600 to-amber-500 bg-clip-text text-transparent">
              {heroTitle.map((letter, index) => (
                <TextSpan key={index} delay={index * 0.1}>
                  {letter === " " ? "\u00A0" : letter}
                </TextSpan>
              ))}
            </div>
            
            <div className="flex flex-wrap justify-center text-l md:text-2xl font-light text-amber-600 mb-8">
              {subtitle.map((letter, index) => (
                <TextSpan key={index} delay={0.5 + index * 0.02}>
                  {letter === " " ? "\u00A0" : letter}
                </TextSpan>
              ))}
            </div>
          </motion.div>

          {/* Key Info Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto"
            variants={itemVariants}
          >
            <div className="bg-gray-50/80 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4">
              <GraduationCap className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700">Computing & IT Graduate</p>
              <p className="text-xs text-amber-600">Open University London, 2025</p>
            </div>
            
            <div className="bg-gray-50/80 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4">
              <Building className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700">Founder & Director</p>
              <p className="text-xs text-amber-600">3 Tech Companies</p>
            </div>
            
            <div className="bg-gray-50/80 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4">
              <MapPin className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700">Based in</p>
              <p className="text-xs text-amber-600">United Kingdom</p>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div 
            className="flex justify-center space-x-4 mb-8"
            variants={itemVariants}
          >
            <a href="https://github.com/iPaha1" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300 backdrop-blur-sm">
                <GitHub className="h-5 w-5" />
              </Button>
            </a>
            <a href="https://www.linkedin.com/in/isaac-paha-578911a9/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300 backdrop-blur-sm">
                <Linkedin className="h-5 w-5" />
              </Button>
            </a>
            <Link href="mailto:pahaisaac@gmail.com">
              <Button variant="outline" size="icon" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300 backdrop-blur-sm">
                <Mail className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Link href="/projects">
              <Button className="group bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 transition-all duration-300 transform hover:scale-105" size="lg">
                View My Work
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            {/* <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm px-8 py-3" size="lg">
              Download CV
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button> */}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="w-6 h-6 text-amber-600" />
          </motion.div>
        </motion.div>
      </section>

      {/* Companies Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
              My Companies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leading innovation across three tech companies, serving clients globally with cutting-edge digital solutions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {companies.map((company, index) => (
              <CompanyCard key={company.name} company={company} delay={index * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="relative z-10 py-20 px-4 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
              Products I&apos;ve Built
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solving real problems with technology that makes a difference in people&apos;s lives.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-amber-100/80 to-amber-200/40 border border-amber-500/40 rounded-lg p-8 hover:border-amber-500/60 hover:bg-gradient-to-br hover:from-amber-200/80 hover:to-amber-300/40 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Rocket className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-semibold text-black">{product.name}</h3>
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-gray-700">{product.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
              Tech Stack & Skills
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mastering modern technologies to build scalable, efficient, and beautiful applications.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-4 justify-center max-w-4xl mx-auto">
            {techStack.map((tech, index) => (
              <TechBadge key={tech} tech={tech} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-r from-amber-100/30 to-amber-200/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Users className="w-16 h-16 text-amber-600 mx-auto mb-8" />
            <h2 className="text-3xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
              My Vision
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              I build technology that solves real problems — with a focus on employment, commerce, education, and productivity in Africa and beyond. Every line of code is written with purpose, every product designed with impact in mind.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;




// "use client";

// import React, { useState, useEffect } from 'react';
// import Image from "next/image";
// import { motion, useAnimationControls } from 'framer-motion';
// import { 
//   ArrowRight, 
//   Linkedin, 
//   Mail, 
//   Globe, 
//   Code, 
//   MapPin,
//   GraduationCap,
//   Building,
//   Users,
//   Rocket,
//   ChevronDown,
//   ExternalLink
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
// import { GitHub } from '@mui/icons-material';



// // Company Card Component
// type Company = {
//   name: string;
//   location: string;
//   description: string;
//   website: string;
// };

// interface CompanyCardProps {
//   company: Company;
//   delay?: number;
// }


// // Enhanced TextSpan component with improved animations
// interface TextSpanProps {
//   children: React.ReactNode;
//   delay?: number;
// }

// const TextSpan = ({ children, delay = 0 }: TextSpanProps) => {
//   const controls = useAnimationControls();

//   const rubberBand = () => {
//     controls.start({
//       transform: [
//         "scale3d(1, 1, 1)",
//         "scale3d(1.3, 0.7, 1)",
//         "scale3d(0.8, 1.2, 1)",
//         "scale3d(1.1, 0.9, 1)",
//         "scale3d(1, 1, 1)",
//       ],
//       transition: {
//         duration: 0.8,
//         ease: "easeInOut",
//         times: [0, 0.3, 0.5, 0.8, 1],
//       }
//     });
//   };

//   return (
//     <motion.span 
//       animate={controls}
//       onMouseOver={rubberBand}
//       initial={{ opacity: 0, y: 20 }}
//       transition={{ delay, duration: 0.5 }}
//       className="inline-block cursor-pointer hover:text-amber-400 transition-colors duration-300"
//     >
//       {children}
//     </motion.span>
//   );
// };


// const CompanyCard: React.FC<CompanyCardProps> = ({ company, delay = 0 }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay, duration: 0.6 }}
//       whileHover={{ y: -5, scale: 1.02 }}
//       className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-lg p-6 hover:border-amber-500/40 transition-all duration-300"
//     >
//       <div className="flex items-center gap-3 mb-3">
//         <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center">
//           <Building className="w-4 h-4 text-black" />
//         </div>
//         <h3 className="text-lg font-semibold text-white">{company.name}</h3>
//       </div>
//       <p className="text-amber-400 text-sm mb-2">{company.location}</p>
//       <p className="text-gray-300 text-sm mb-4">{company.description}</p>
//       <div className="flex items-center gap-2">
//         <Globe className="w-4 h-4 text-amber-500" />
//         <a 
//           href={`https://${company.website}`} 
//           target="_blank" 
//           rel="noopener noreferrer"
//           className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
//         >
//           {company.website}
//         </a>
//       </div>
//     </motion.div>
//   );
// };

// // Tech Stack Badge Component
// interface TechBadgeProps {
//   tech: string;
//   delay?: number;
// }

// const TechBadge: React.FC<TechBadgeProps> = ({ tech, delay = 0 }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.8 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ delay, duration: 0.4 }}
//       whileHover={{ scale: 1.1 }}
//       className="bg-amber-500/10 border border-amber-500/30 rounded-md px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/20 transition-all duration-300 cursor-default"
//     >
//       {tech}
//     </motion.div>
//   );
// };

// const LandingPage = () => {
//   const [isVisible, setIsVisible] = useState(false);
//   const heroTitle = "Isaac Paha".split("");
//   const subtitle = "Full-Stack Developer & Tech Entrepreneur".split("");

//   useEffect(() => {
//     setIsVisible(true);
//   }, []);

//   const companies = [
//     {
//       name: "iPaha Ltd",
//       location: "🇬🇧 United Kingdom",
//       description: "IT consultancy providing custom software and digital solutions",
//       website: "ipahait.com"
//     },
//     {
//       name: "iPahaStores Ltd",
//       location: "🇬🇧 United Kingdom", 
//       description: "Tech company offering SaaS and e-commerce solutions",
//       website: "ipahastore.com"
//     },
//     {
//       name: "Okpah Ltd",
//       location: "🇬🇭 Ghana",
//       description: "Innovation-driven startup building local digital platforms",
//       website: "okpah.com"
//     }
//   ];

//   const techStack = [
//     "React.js", "Next.js", "TypeScript", "Node.js", "Tailwind CSS",
//     "Prisma ORM", "MySQL", "Express.js", "Clerk", "Stripe"
//   ];

//   const products = [
//     {
//       name: "oKadwuma.com",
//       description: "Job search platform connecting Ghanaian jobseekers and employers"
//     },
//     {
//       name: "okDdwa.com", 
//       description: "Multi-tenant e-commerce marketplace for local traders"
//     }
//   ];

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: { 
//       opacity: 1,
//       transition: { staggerChildren: 0.1, delayChildren: 0.2 }
//     }
//   };

//   const itemVariants = {
//     hidden: { y: 30, opacity: 0 },
//     visible: { 
//       y: 0, 
//       opacity: 1,
//       transition: { type: 'spring', stiffness: 100, damping: 12 }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
//       {/* Animated Background Elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-md blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/3 rounded-md blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-500/2 to-transparent rounded-md"></div>
//       </div>

//       {/* Hero Section */}
//       <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
//         <motion.div 
//           className="text-center max-w-6xl mx-auto"
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           {/* Profile Image */}
//           <motion.div
//             variants={itemVariants}
//             whileHover={{ scale: 1.1, rotate: 5 }}
//             className="mb-8"
//           >
//             <div className="relative inline-block">
//               <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-md blur-lg opacity-20 animate-pulse"></div>
//               <Image
//                 src="/images/photo1.png"
//                 alt="Isaac Paha - Full-Stack Developer & Tech Entrepreneur"
//                 width={120}
//                 height={120}
//                 className="relative rounded-md mx-auto border-2 border-amber-500/50 grayscale hover:grayscale-0 transition-all duration-500"
//               />
//               <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-md p-2">
//                 <Code className="w-4 h-4 text-black" />
//               </div>
//             </div>
//           </motion.div>

//           {/* Main Title */}
//           <motion.div className="mb-6" variants={itemVariants}>
//             <div className="flex flex-wrap justify-center text-4xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">
//               {heroTitle.map((letter, index) => (
//                 <TextSpan key={index} delay={index * 0.1}>
//                   {letter === " " ? "\u00A0" : letter}
//                 </TextSpan>
//               ))}
//             </div>
            
//             <div className="flex flex-wrap justify-center text-xl md:text-2xl font-light text-amber-400 mb-8">
//               {subtitle.map((letter, index) => (
//                 <TextSpan key={index} delay={0.5 + index * 0.02}>
//                   {letter === " " ? "\u00A0" : letter}
//                 </TextSpan>
//               ))}
//             </div>
//           </motion.div>

//           {/* Key Info Cards */}
//           <motion.div 
//             className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto"
//             variants={itemVariants}
//           >
//             <div className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4">
//               <GraduationCap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
//               <p className="text-sm text-gray-300">Computing & IT Graduate</p>
//               <p className="text-xs text-amber-400">Open University London, 2025</p>
//             </div>
            
//             <div className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4">
//               <Building className="w-6 h-6 text-amber-500 mx-auto mb-2" />
//               <p className="text-sm text-gray-300">Founder & Director</p>
//               <p className="text-xs text-amber-400">3 Tech Companies</p>
//             </div>
            
//             <div className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4">
//               <MapPin className="w-6 h-6 text-amber-500 mx-auto mb-2" />
//               <p className="text-sm text-gray-300">Based in</p>
//               <p className="text-xs text-amber-400">United Kingdom</p>
//             </div>
//           </motion.div>

//           {/* Social Links */}
//           <motion.div 
//             className="flex justify-center space-x-4 mb-8"
//             variants={itemVariants}
//           >
//             <a href="https://github.com/iPaha1" target="_blank" rel="noopener noreferrer">
//               <Button variant="outline" size="icon" className="border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300 backdrop-blur-sm">
//                 <GitHub className="h-5 w-5" />
//               </Button>
//             </a>
//             <a href="https://www.linkedin.com/in/isaac-paha-578911a9/" target="_blank" rel="noopener noreferrer">
//               <Button variant="outline" size="icon" className="border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300 backdrop-blur-sm">
//                 <Linkedin className="h-5 w-5" />
//               </Button>
//             </a>
//             <Link href="mailto:pahaisaac@gmail.com">
//               <Button variant="outline" size="icon" className="border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300 backdrop-blur-sm">
//                 <Mail className="h-5 w-5" />
//               </Button>
//             </Link>
//           </motion.div>
          
//           {/* CTA Buttons */}
//           <motion.div 
//             className="flex flex-col sm:flex-row gap-4 justify-center items-center"
//             variants={itemVariants}
//           >
//             <Link href="/projects">
//               <Button className="group bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 transition-all duration-300 transform hover:scale-105" size="lg">
//                 View My Work
//                 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//               </Button>
//             </Link>
            
//             {/* <Button variant="outline" className="border-2 border-white/30 text-amber-600 hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm px-8 py-3" size="lg">
//               Download CV
//               <ArrowRight className="ml-2 h-4 w-4" />
//             </Button> */}
//           </motion.div>

//           {/* Scroll Indicator */}
//           <motion.div 
//             className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
//             animate={{ y: [0, 10, 0] }}
//             transition={{ repeat: Infinity, duration: 2 }}
//           >
//             <ChevronDown className="w-6 h-6 text-amber-500" />
//           </motion.div>
//         </motion.div>
//       </section>

//       {/* Companies Section */}
//       <section className="relative z-10 py-20 px-4">
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 50 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             viewport={{ once: true }}
//             className="text-center mb-16"
//           >
//             <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-amber-400 bg-clip-text text-transparent">
//               My Companies
//             </h2>
//             <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//               Leading innovation across three tech companies, serving clients globally with cutting-edge digital solutions.
//             </p>
//           </motion.div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {companies.map((company, index) => (
//               <CompanyCard key={company.name} company={company} delay={index * 0.2} />
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Products Section */}
//       <section className="relative z-10 py-20 px-4 bg-black/50">
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 50 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             viewport={{ once: true }}
//             className="text-center mb-16"
//           >
//             <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-amber-400 bg-clip-text text-transparent">
//               Products I&apos;ve Built
//             </h2>
//             <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//               Solving real problems with technology that makes a difference in people&apos;s lives.
//             </p>
//           </motion.div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
//             {products.map((product, index) => (
//               <motion.div
//                 key={product.name}
//                 initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
//                 whileInView={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.8, delay: index * 0.2 }}
//                 viewport={{ once: true }}
//                 whileHover={{ y: -5 }}
//                 className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-lg p-8 hover:border-amber-500/50 transition-all duration-300"
//               >
//                 <div className="flex items-center gap-3 mb-4">
//                   <Rocket className="w-6 h-6 text-amber-500" />
//                   <h3 className="text-xl font-semibold text-white">{product.name}</h3>
//                   <ExternalLink className="w-4 h-4 text-amber-400" />
//                 </div>
//                 <p className="text-gray-300">{product.description}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Tech Stack Section */}
//       <section className="relative z-10 py-20 px-4">
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 50 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             viewport={{ once: true }}
//             className="text-center mb-16"
//           >
//             <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-amber-400 bg-clip-text text-transparent">
//               Tech Stack & Skills
//             </h2>
//             <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//               Mastering modern technologies to build scalable, efficient, and beautiful applications.
//             </p>
//           </motion.div>

//           <div className="flex flex-wrap gap-4 justify-center max-w-4xl mx-auto">
//             {techStack.map((tech, index) => (
//               <TechBadge key={tech} tech={tech} delay={index * 0.1} />
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Vision Section */}
//       <section className="relative z-10 py-20 px-4 bg-gradient-to-r from-amber-500/5 to-amber-600/5">
//         <div className="max-w-4xl mx-auto text-center">
//           <motion.div
//             initial={{ opacity: 0, y: 50 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             viewport={{ once: true }}
//           >
//             <Users className="w-16 h-16 text-amber-500 mx-auto mb-8" />
//             <h2 className="text-3xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white to-amber-400 bg-clip-text text-transparent">
//               My Vision
//             </h2>
//             <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
//               I build technology that solves real problems — with a focus on employment, commerce, education, and productivity in Africa and beyond. Every line of code is written with purpose, every product designed with impact in mind.
//             </p>
//           </motion.div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default LandingPage;