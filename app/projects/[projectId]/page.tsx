import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

// This data should ideally come from a database or API
const projectsData: { [key: string]: {
  title: string;
  description: string;
  fullDescription: string;
  technologies: string[];
  image: string;
}} = {
  'multi-functional-ecommerce-dashboard': {
    title: "Multi-Functional E-Commerce Website Dashboard",
    description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
    fullDescription: "This project involved creating a fully functional e-commerce dashboard that allows administrators to manage products, orders, and customers. It features real-time analytics, inventory management, and a user-friendly interface for efficient operation.",
    technologies: ["React", "Node.js", "Express", "MongoDB", "Chart.js"],
    image: "/images/background1.jpeg"
  },
  'ecommerce-store-website': {
    title: "E-Commerce Store Website",
    description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
    fullDescription: "This e-commerce store provides a smooth shopping experience for customers. It includes features such as product categorization, search functionality, shopping cart, secure checkout process, and user account management.",
    technologies: ["Next.js", "Strapi", "PostgreSQL", "Stripe", "Tailwind CSS"],
    image: "/images/background1.jpeg"
  },
};

export async function generateStaticParams() {
  return Object.keys(projectsData).map((id) => ({
    projectId: id,
  }));
}

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const project = projectsData[params.projectId];

  if (!project) notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/#projects">
      <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors m-4 mt-10">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
      </Button>
      </Link>
      {/* <Link href="/#projects" className="inline-flex items-center text-black dark:text-white hover:underline mb-6">
      <Button variant="outline" size="icon" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
      </Button>
      </Link> */}
      <h1 className="text-4xl font-bold mb-6 text-black dark:text-white">{project.title}</h1>
      <Image 
        src={project.image} 
        alt={project.title}
        width={1200}
        height={600} 
        className="w-full max-w-3xl mx-auto mb-8 rounded-lg shadow-lg" 
      />
      <p className="text-xl mb-6 text-gray-700 dark:text-gray-300">{project.fullDescription}</p>
      <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">Technologies Used</h2>
      <ul className="list-disc list-inside mb-8 text-gray-700 dark:text-gray-300">
        {project.technologies.map((tech: string, index: number) => (
          <li key={index}>{tech}</li>
        ))}
      </ul>
      {/* Add more sections as needed, such as challenges, outcomes, etc. */}
    </div>
  );
}