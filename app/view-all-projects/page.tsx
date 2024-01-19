"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import TextSpan from "@/components/text-span";

const ViewAllProjects = () => {
  
  // Mock array of projects with unique data for each project
  const projects = [
    {
      id: 1,
      image: "/images/iPahaStore.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Advance E-Commerce Website",
      // subTitle: "Advance E-Commerce Website",
      // detail: "Additional details for Project 1",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 2,
      image: "/images/iPahaStoreAdmin.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Multi-Purpose Aministration Dashboard",
      // subTitle: "Multi-Purpose Aministration Dashboard",
      // detail: "Additional details for Project 2",
      url: "https://i-paha-store-admin.vercel.app/"
    },
    {
      id: 3,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Event Management System",
      // subTitle: "Project 3 Subtitle",
      // detail: "Additional details for Project 3",
      url: "https://i-paha-events.vercel.app/"
    },

  ];
    {/* {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    {
      id: 4,
      image: "/images/photo1.png",
      description: "Exploring the world of everyday life. Elevate your style with our sophisticated men's suit. Perfect for formal occasions and business meetings, this suit combines classic design with modern comfort. Available in various sizes and colors to suit your preferences.",
      title: "Project 4 Title",
      // subTitle: "Project 4 Subtitle",
      // detail: "Additional details for Project 4",
      url: "https://i-paha-store.vercel.app/"
    },
    // ... add more projects as needed

   
  ];
 */}

  const sentence = "Explore My Projects".split("");

  return (
    <div className="p-4 h-full">
      <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 10 }}
            >
              <div className="flex flex-row text-6xl font-bold mt-20 justify-center">
                {sentence.map((letter, index) => {
                return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
                );
                })}
            </div>
                {/* <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 dark:bg-white"></span>
                </span> */}
            <h1 className="md:hidden text-5xl sm:text-5xl md:text-6xl font-bold">
               Explore My Projects
            </h1>
      </motion.div>
      {/* ... header and other content ... */}
      {/* <h1 className="flex text-5xl font-semibold items-center justify-center mt-10">Explore My Projects</h1> */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
        {projects.map((project) => (
          <a key={project.id} href={project.url} target="_blank" rel="noopener noreferrer" className=" group cursor-pointer rounded-xl border p-3 space-y-4 hover:animate-pulse">
            <div className="aspect-square rounded-xl bg-gray-100 relative">
              <Image 
                src={project.image} 
                alt={project.title} 
                layout="fill"
                className="aspect-square object-cover rounded-md"
              />
            </div>
            <p className="text-sm text-gray-700">{project.description}</p>
            <div>
              <p className="font-semibold text-lg">{project.title}</p>
              {/* <p className="text-sm text-gray-500">{project.subTitle}</p> */}
            </div>
            <div className="flex items-center justify-between">
              {/* <p>{project.detail}</p> */}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ViewAllProjects;
