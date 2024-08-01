import Blog from "@/components/blog/blog";

const blogPosts = [
  {
    id: 'my-journey-into-programming',
    title: 'My Journey into Programming',
    excerpt: 'How I discovered my passion for coding and decided to pursue software engineering.',
    date: '2022-07-01',
    image: "/images/deliveryImage1.jpeg"
  },
  {
    id: 'building-portfolio-website',
    title: 'Creating My Portfolio Website from Scratch',
    excerpt: 'The process of building my own portfolio site using Next js, tailwind css, shadcn UI, JavaScript and TypeScript.',
    date: '2022-08-15',
    image: "/images/portfolioImage1.png"
  },
//   {
//     id: 'python-basics-in-30-days',
//     title: 'Mastering Python Basics in 30 Days',
//     excerpt: 'My experience learning Python fundamentals in just one month, with code samples and tips.',
//     date: '2022-07-15',
//     image: "/images/python-basics.jpg"
//   },
 
//   {
//     id: 'first-hackathon-experience',
//     title: 'My First Hackathon: Lessons Learned',
//     excerpt: 'Reflections on participating in my first coding competition and what I gained from it.',
//     date: '2024-08-01',
//     image: "/images/hackathon.jpg"
//   },
  
];

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-12 mt-20">
      <h1 className="text-4xl font-bold mb-8 text-center">My Blog</h1>
      <Blog posts={blogPosts} />
    </div>
  );
}



// import Blog from "@/components/blog/blog";


// // This data should ideally come from a database or API
// const blogPosts = [
//   {
//     id: 'introduction-to-react',
//     title: 'Introduction to React',
//     excerpt: 'Learn the basics of React and how to build your first component.',
//     date: '2023-07-01',
//     image: "/images/background1.jpeg"
//   },
//   {
//     id: 'mastering-nextjs',
//     title: 'Mastering Next.js',
//     excerpt: 'Dive deep into Next.js and learn how to build efficient, scalable web applications.',
//     date: '2023-07-15',
//     image: "/images/background1.jpeg"
//   },
//   {
//     id: 'introduction-to-react',
//     title: 'Introduction to React',
//     excerpt: 'Learn the basics of React and how to build your first component.',
//     date: '2023-07-01',
//     image: "/images/background1.jpeg"
//   },
//   {
//     id: 'mastering-nextjs',
//     title: 'Mastering Next.js',
//     excerpt: 'Dive deep into Next.js and learn how to build efficient, scalable web applications.',
//     date: '2023-07-15',
//     image: "/images/background1.jpeg"
//   },
//   // Add more blog posts here
// ];

// export default function BlogPage() {
//   return (
//     <div className="container mx-auto px-4 py-12 mt-20">
//       <h1 className="text-4xl font-bold mb-8 text-center">Blog</h1>
//       <Blog posts={blogPosts} />
//     </div>
//   );
// }