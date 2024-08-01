import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const projectsData: { [key: string]: {
  title: string;
  description: string;
  fullDescription: string;
  features: string[];
  challenges: string[];
  outcomes: string[];
  technologies: string[];
  image: string;
  liveLink: string;
}} = {
  'multi-functional-ecommerce-dashboard': {
    title: "E-Commerce Dashboard",
    description: "A comprehensive dashboard for managing all aspects of an e-commerce platform.",
    fullDescription: "This multi-functional e-commerce dashboard is a robust, fully-operational system currently employed by a real e-commerce platform. It serves as the central hub for managing all frontend store operations, offering a wide array of features designed to streamline e-commerce management and enhance user experience.",
    features: [
      "Product Management: Add and manage billboards, colors, sizes, and products",
      "Gift Card System: Create and manage gift cards, including custom designs",
      "Wallet Management: Implement store wallet functionality with customizable settings",
      "Order Processing: Comprehensive order management system",
      "Customer Management: Track and manage customer data and interactions",
      "Review System: Manage product reviews",
      "Shipping and Returns: Handle shipping, returns, and refunds efficiently",
      "Abandoned Cart Recovery: Tools to address and recover abandoned carts",
      "API Key Management: Generate and manage API keys for the frontend store",
      "Customizable Settings: Flexible system settings for tailored operations",
      "Notification System: Keep administrators informed of important events",
      "Theme Options: Toggle between light and dark themes for user preference",
      "Analytics Dashboard: Comprehensive overview of store performance and metrics"
    ],
    challenges: [
      "Integrating multiple complex systems into a cohesive, user-friendly interface",
      "Ensuring real-time data synchronization between the dashboard and frontend store",
      "Implementing robust security measures to protect sensitive customer and business data",
      "Optimizing performance to handle large volumes of data and concurrent users"
    ],
    outcomes: [
      "Significantly improved efficiency in managing e-commerce operations",
      "Enhanced user experience for both administrators and customers",
      "Increased sales through features like abandoned cart recovery and gift card system",
      "Improved decision-making capabilities through comprehensive analytics"
    ],
    technologies: ["Next.js", "Stripe", "Clerk Authentication", "Prisma ORM", "MySQL (Amazon-hosted)", "Vercel", "Tailwind CSS", "shadcn UI", "Next.js App Router", "Next SEO"],
    image: "/images/Dashboard-image.png",
    liveLink: "https://project-ecommerce-dashboard.vercel.app/",
  },
  
  'ecommerce-store-website': {
    title: "E-Commerce Store",
  description: "A sophisticated, user-centric frontend e-commerce platform seamlessly integrated with a powerful backend dashboard.",
  fullDescription: `
    This elegant e-commerce store frontend represents the culmination of modern web development practices, offering an unparalleled shopping experience. Designed with a keen focus on user experience (UX) and user interface (UI) principles, it serves as the customer-facing component of our comprehensive e-commerce solution.

    The store's design philosophy centers around creating an intuitive, engaging, and efficient shopping journey. Every element, from the homepage to the checkout process, has been meticulously crafted to guide customers smoothly through their purchasing decisions.

    What sets this frontend store apart is its seamless integration with our multi-functional dashboard. This integration ensures real-time synchronization of product information, inventory levels, and customer data, creating a cohesive ecosystem that enhances both the customer experience and backend operations.
  `,
  features: [
    "Dynamic Product Catalog: Automatically updated from the dashboard, ensuring real-time accuracy in product listings, prices, and availability.",
    "Advanced Search and Filtering: Intuitive search functionality with smart filters to help customers find products quickly.",
    "Responsive Design: Optimized for various devices and screen sizes, providing a consistent experience across desktop, tablet, and mobile.",
    "Add to Cart: Smooth, AJAX-powered add-to-cart process with real-time updates and a mini-cart preview.",
    "Favorites List: Personalized wishlist functionality allowing customers to save items for future purchase.",
    "Customer Wallet Integration: Secure digital wallet system for quick and easy payments.",
    "Gift Card System: Purchase, redeem, and manage gift cards directly within the store interface.",
    "Customer Accounts: Personalized accounts for order tracking, address management, and preference settings.",
    "Secure Checkout: Stripe-powered checkout process with multiple payment options and security features.",
    "Order Tracking: Real-time order status updates integrated with the dashboard's order management system.",
    "Product Reviews: Customer review system with ratings, helping inform purchase decisions.",
    "Related Products: Smart product recommendations based on viewing and purchase history.",
    "Newsletter Subscription: Easy opt-in for promotional emails, integrated with the dashboard's marketing tools.",
    "Dark Mode Toggle: User-selectable light and dark themes for comfortable browsing in any environment."
  ],
  challenges: [
    "Ensuring seamless data flow and real-time synchronization with the backend dashboard",
    "Optimizing performance and load times while maintaining rich functionality and visual appeal",
    "Implementing a fully responsive design that provides a consistent, high-quality experience across all devices",
    "Balancing aesthetic appeal with functional efficiency in the user interface",
    "Integrating multiple third-party services (e.g., Stripe for payments) while maintaining a cohesive user experience",
    "Implementing robust client-side validation and error handling to enhance user experience and reduce server load",
    "Optimizing SEO to improve visibility and attract organic traffic",
    "Ensuring accessibility compliance to make the store usable for all customers, including those with disabilities"
  ],
  outcomes: [
    "Significantly increased customer engagement, with longer average session durations and lower bounce rates",
    "Higher conversion rates due to streamlined shopping and checkout processes",
    "Improved inventory management through real-time integration with the dashboard",
    "Enhanced brand image through a modern, user-friendly online presence",
    "Increased mobile sales due to fully responsive design",
    "Reduced cart abandonment rates through an optimized checkout process",
    "Improved customer loyalty and repeat purchases facilitated by the user account and favorites features",
    "Increased average order value through effective product recommendations and upselling features"
  ],
  technologies: [
    "Next.js: For server-side rendering and optimal performance",
    "React: For building a dynamic and interactive user interface",
    "Tailwind CSS: For rapid, responsive UI development",
    "shadcn UI: For consistent and customizable UI components",
    "Next.js App Router: For efficient, dynamic routing",
    "Next SEO: For search engine optimization",
    "Stripe: For secure payment processing",
    "Clerk: For user authentication and account management",
    "Prisma: For type-safe database access",
    "Vercel: For deployment and hosting"
  ],
  image: "/images/background1.jpeg",
  liveLink: "https://vercel.com/ipaha1s-projects/project-ecommerce-store",
  },
};

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const project = projectsData[params.projectId];
  if (!project) notFound();

  return (
    <div className="container mx-auto px-4 py-12 ">
      <Link href="/#projects">
        <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors m-4 mt-10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </Link>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-6 text-center text-gray-800 dark:text-white mt-10">{project.title}</h1>
        
        <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden shadow-2xl">
          <Image 
            src={project.image} 
            alt={project.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 hover:scale-105"
          />
        </div>

        <div className="flex justify-center mb-10">
          <a href={project.liveLink} target="_blank" rel="noopener noreferrer">
            <Button className="hover:bg-white hover:text-black bg-amber-500 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 transform hover:scale-105 flex items-center">
              Try Live Project <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>

        
        <p className="text-xl mb-10 text-gray-600 dark:text-gray-300 leading-relaxed">{project.fullDescription}</p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="border border-amber-500 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-amber-500">Key Features</h2>
            <ul className="space-y-2">
              {project.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="border border-amber-500 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-amber-500">Challenges Overcome</h2>
            <ul className="space-y-2">
              {project.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <span className="text-gray-700 dark:text-gray-300">{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="bg-amber-500 text-black dark:text-white p-8 rounded-lg shadow-xl mb-12">
          <h2 className="text-3xl font-bold mb-6">Outcomes</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.outcomes.map((outcome, index) => (
              <li key={index} className="flex items-center border border-black bg-opacity-20 p-4 rounded-lg">
                <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Technologies Used</h2>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// import Link from 'next/link';
// import { ArrowLeft } from 'lucide-react';
// import { notFound } from 'next/navigation';
// import Image from 'next/image';
// import { Button } from '@/components/ui/button';

// // This data should ideally come from a database or API
// const projectsData: { [key: string]: {
//   title: string;
//   description: string;
//   fullDescription: string;
//   technologies: string[];
//   image: string;
// }} = {
//   'multi-functional-ecommerce-dashboard': {
//     title: "Multi-Functional E-Commerce Website Dashboard",
//     description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//     fullDescription: "This project involved creating a fully functional e-commerce dashboard that allows administrators to manage products, orders, and customers. It features real-time analytics, inventory management, and a user-friendly interface for efficient operation.",
//     technologies: ["React", "Node.js", "Express", "MongoDB", "Chart.js"],
//     image: "/images/Dashboard-image.png"
//   },
//   'ecommerce-store-website': {
//     title: "E-Commerce Store Website",
//     description: "Constructed a comprehensive e-commerce platform, emphasizing seamless user experience and robust backend management.",
//     fullDescription: "This e-commerce store provides a smooth shopping experience for customers. It includes features such as product categorization, search functionality, shopping cart, secure checkout process, and user account management.",
//     technologies: ["Next.js", "Clerk Authentication", "PostgreSQL", "Stripe", "Tailwind CSS"],
//     image: "/images/background1.jpeg"
//   },
// };

// export async function generateStaticParams() {
//   return Object.keys(projectsData).map((id) => ({
//     projectId: id,
//   }));
// }

// export default function ProjectPage({ params }: { params: { projectId: string } }) {
//   const project = projectsData[params.projectId];

//   if (!project) notFound();

//   return (
//     <div className="container mx-auto px-4 py-12">
//       <Link href="/#projects">
//       <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors m-4 mt-10">
//         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
//       </Button>
//       </Link>
//       {/* <Link href="/#projects" className="inline-flex items-center text-black dark:text-white hover:underline mb-6">
//       <Button variant="outline" size="icon" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
//         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
//       </Button>
//       </Link> */}
//       <h1 className="flex items-center justify-center text-4xl font-bold mb-6 text-black dark:text-white mt-10 ">{project.title}</h1>
//       <Image 
//         src={project.image} 
//         alt={project.title}
//         width={1200}
//         height={600} 
//         className="w-full max-w-3xl mx-auto mb-8 rounded-lg shadow-lg" 
//       />
//       <p className="text-xl mb-6">{project.fullDescription}</p>
//       <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Technologies Used</h2>
//       <ul className="list-disc list-inside mb-8">
//         {project.technologies.map((tech: string, index: number) => (
//           <li key={index}>{tech}</li>
//         ))}
//       </ul>
//       {/* Add more sections as needed, such as challenges, outcomes, etc. */}
//     </div>
//   );
// }