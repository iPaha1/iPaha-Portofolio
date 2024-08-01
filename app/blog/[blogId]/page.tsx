import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const CodeBlock = dynamic(() => import('@/components/code-block'), { ssr: false });

type ContentBlock = 
  | { type: 'text'; content: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'quote'; content: string; author?: string }
  | { type: 'code'; content: string; language: string };

interface BlogPost {
  title: string;
  date: string;
  author: string;
  coverImage: string;
  excerpt: string;
  content: ContentBlock[];
}

const blogPostsData: { [key: string]: BlogPost } = {
  'my-journey-into-programming': {
    title: 'My Journey into Programming',
    date: '2024-07-01',
    author: 'Isaac Paha',
    coverImage: "/images/footballImage.jpeg",
    excerpt: 'How I discovered my passion for coding and decided to pursue software engineering.',
    content: [
        { type: 'text', content: 'In 2019, I traded the football pitches of China for the bustling streets of the UK, carrying with me dreams of a new beginning. Little did I know that the world was about to change dramatically, reshaping my path in ways I couldn\'t have imagined.', },
      { type: 'image', src: '/images/deliveryImage1.jpeg', alt: 'Some picture time at a drop off', caption: 'Some picture time at a drop off' },
      { type: 'text', content: 'As a former semi-professional footballer, I found myself working in a restaurant to make ends meet. Then, COVID-19 struck. The pandemic that shook the world became the unexpected catalyst for my career transformation. As lockdowns forced the restaurant to close, I watched as those with digital skills seamlessly transitioned to remote work. It was a stark wake-up call – the future belonged to those who could adapt to a digital landscape. My love for IT had always simmered beneath the surface, but now it burst into full flame. The enforced downtime became an opportunity for self-reflection and growth. I began to explore programming concepts on my own, each line of code igniting a passion I never knew I had. But I yearned for more – a structured education that could solidify my skills and open doors to a new career.' },
      { type: 'quote', content: 'Fortune favors the bold.', author: 'the Roman poet Virgil' },
      { type: 'text', content: 'Fortune favors the bold, they say, and it certainly smiled upon me when I discovered UberEats\' innovative program. It was a golden ticket – a chance for delivery riders to study at the Open University. Without hesitation, I signed up, pedaling through the streets not just to deliver food, but to deliver myself to a brighter future. Balancing work and study was challenging, but every assignment completed, every concept mastered, felt like scoring a goal in the most important match of my life. The computing and IT program opened up a world of possibilities, each module a stepping stone towards my new dream.' },
        { type: 'text', content: 'As I approach the final stretch of my degree, set to graduate in the summer of 2024, I\'m filled with immense gratitude. UberEats and the Open University didn\'t just offer education – they offered hope, a second chance, and the tools to reinvent myself. Their program is a testament to the power of corporate responsibility and the transformative impact of accessible education.'},
      { type: 'text', content: 'Now, as I stand on the cusp of completing my degree, I look back at the winding road that brought me here. From the football fields of China to the dining tables of the UK, from the uncertainty of a pandemic to the promise of a new career, my journey into programming has been nothing short of extraordinary. It is a journey that has taught me resilience, adaptability, and the boundless potential of the human spirit. And as I take my first steps into the world of software engineering, I carry with me the lessons of the past and the dreams of the future.' },
      { type: 'text', content: 'To anyone considering a career change, remember: every expert was once a beginner. Your past experiences are not limitations; they are unique perspecitives that can bring fresh insights to your new field. The digital world is vast and full of opportunities - all you need is the courage to take the first step.' }, 
      { type: 'text', content: "As I look forward to my first IT job, I'm not just seeking employment; I'm stepping into a world of endless possibilities. The same determination that drove me on the football field now propels me into the tech industry. I'm ready to tackle challenges, collaborate with brilliant minds, and contribute to the digital innovations that shape our world. The beautiful game taught me the value of teamwork, strategy, and perseverance. Now, I'm excited to bring these qualities to the world of technology, where every day presents a new opportunity to learn, grow, and make a difference. My story is far from over. In fact, it feels like it's just beginning. And I can't wait to see where this new path will lead me." },
      //   { type: 'code', language: 'python', content: `# My first Python program print("Hello, World!") print("I'm in love with coding!")`},
    //   { type: 'text', content: 'This simple program marked the beginning of my programming journey. From that moment on, I knew I wanted to pursue a career in software engineering. The excitement of building and creating through code continues to drive me forward every day.' },
    ]
  },
  'building-portfolio-website': {
    title: 'Creating My Portfolio Website from Scratch',
    date: '2024-08-15',
    author: 'Isaac Paha',
    coverImage: "/images/portfolioImage1.png",
    excerpt: 'The process of building my own portfolio site using Next js, tailwind css, shadcn UI, JavaScript and TypeScript.',
    content: [
      { type: 'text', content: "As a budding software developer, I knew that having a strong online presence was crucial. That's why I decided to embark on the journey of creating my portfolio website from scratch. This project not only showcased my skills but also served as a learning experience, pushing me to apply various technologies and best practices. In this blog post, I'll walk you through the process of how I built my portfolio website." },
      { type: 'text', content: "The first step was to plan out the structure of my website. I decided on a single-page application with several key sections: Landing Page, About Me, Projects, and Contact. This structure would allow visitors to easily navigate through my work and get to know me better." },
      { type: 'image', src: '/images/portfolioImage.png', alt: 'Portfolio Sketch', caption: 'Initial sketch of my portfolio design' },
      { type: 'text', content: "For the project, I chose Next.js as the framework for building the site. Next.js offers server-side rendering, static site generation, and a great developer experience. I also used Tailwind CSS for styling, which allowed me to quickly create a responsive and visually appealing design. Additionally, I incorporated Shadcn UI for some custom components and animations." },
      { type: 'text', content: " The landing page is the first thing visitors see when they arrive at my site. It features a hero section with a brief introduction and a call-to-action button. Here's a snippet of the JSX code I used to create the landing page:" },
      { type: 'code', language: 'html', content: `
        const LandingPage = () => {
        const sentence = "Welcome to My World of Innovation".split("");
        
        return (
          <div className="min-h-screen flex items-center justify-center">
            <motion.div className="text-center p-8 z-10">
              <Image
                src="/images/photo1.png"
                alt="Picture of the author"
                width={100}
                height={100}
                className="rounded-full mx-auto mb-8"
              />
              <div className="flex flex-wrap justify-center text-4xl md:text-5xl font-bold mb-4">
                {sentence.map((letter, index) => (
                  <TextSpan key={index}>{letter === " " ? "\u00A0" : letter}</TextSpan>
                ))}
              </div>
              {/* More content here */}
            </motion.div>
          </div>
        );
      };
              `},
      { type: 'text', content: "The About Me section gives visitors a deeper insight into my background and skills:" },
      { type: 'code', language: 'html', content: `
        const AboutSection = () => {
          return (
            <section id="about" className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
              <motion.h2 className="text-5xl font-bold mb-12 text-center">
                About Me
              </motion.h2>
              <motion.div className="space-y-12">
                <motion.p className="text-xl leading-relaxed">
                  My journey in computing and IT has been more than just acquiring degrees; it's been a journey of constant learning, skill development, and applying these in practical scenarios.
                </motion.p>
                {/* More content about education and skills */}
              </motion.div>
            </section>
          );
        };
      `},
      { type: 'text', content: "To showcase my technical skills, I created a visually appealing grid layout:" },
      { type: 'code', language: 'html', content: `
        const SkillsSection = () => {
        const skillCategories = [
          {
            name: "Front-End Development",
            icon: <Layout className="w-8 h-8 mb-4" />,
            skills: ["JavaScript", "React JS", "HTML", "CSS", "Tailwind", "Framer Motion"]
          },
          // More categories...
        ];

        return (
          <section id="skills" className="py-20">
            <div className="container mx-auto px-4">
              <motion.h2 className="text-5xl font-bold mb-12 text-center">
                My Skills
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {skillCategories.map((category, index) => (
                  <motion.div key={index} className="bg-white dark:bg-black p-6 rounded-xl shadow-lg">
                    {/* Skill category content */}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      };
      `},
      { type: 'text', content: "For the contact form, I implemented form validation using React Hook Form and Zod:"},
      { type: 'code', language: 'html', content: `
        const ContactMePage = () => {
        const form = useForm<ProfileFormValues>({
          resolver: zodResolver(profileFormSchema),
          mode: "onChange",
        });

        async function onSubmit(data: ProfileFormValues) {
          // Handle form submission
        }

        return (
          <section id="contact" className="py-20 bg-white dark:bg-black">
            <div className="container mx-auto px-4 max-w-4xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Form fields */}
                </form>
              </Form>
            </div>
          </section>
        );
      };
      `},
      { type: 'text', content: "Finally, I assembled all the components in the main page:"},
      { type: 'code', language: 'html', content: `
        const HomePage = () => {
        return (
          <div className="space-y-10 pb-10">
            <LandingPage />
            <AboutSection />
            <ProjectsSection />
            <SkillsSection />
            <Container>
              <ContactMePage />
            </Container>
          </div>
        );
      };
      `},
      { type: 'text', content: "All the code can be found in my github repository, where I also documented the process and challenges I faced. Building my portfolio website was a rewarding experience that not only showcased my skills but also helped me grow as a developer. I encourage anyone looking to create their own site to dive in and start coding. The possibilities are endless, and the journey is worth it." },
    ]
  },
  'python-basics-in-30-days': {
    title: 'Mastering Python Basics in 30 Days',
    date: '2024-07-15',
    author: 'Isaac Paha',
    coverImage: "/images/python-basics.jpg",
    excerpt: 'My experience learning Python fundamentals in just one month, with code samples and tips.',
    content: [
      { type: 'text', content: 'After deciding to pursue programming seriously, I set myself a challenge: learn the basics of Python in just 30 days. It was an ambitious goal, but I was determined to succeed.' },
      { type: 'image', src: '/images/python-logo.png', alt: 'Python Logo', caption: 'The friendly language that started it all' },
      { type: 'text', content: 'I started with simple concepts like variables, data types, and basic operations. Here\'s one of the first programs I wrote to practice these concepts:' },
      { type: 'code', language: 'python', content: `
# Calculate the area of a rectangle
length = 10
width = 5
area = length * width
print(f"The area of the rectangle is {area} square units.")
      `},
      { type: 'text', content: 'As the days progressed, I moved on to more complex topics like functions, loops, and data structures. One of the most exciting moments was when I wrote my first function to calculate factorial:' },
      { type: 'code', language: 'python', content: `
def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n-1)

# Test the function
print(factorial(5))  # Output: 120
      `},
      { type: 'text', content: 'By the end of the 30 days, I had a solid grasp of Python basics and even started working on small projects. The journey was challenging but incredibly rewarding, and it solidified my passion for programming.' },
    ]
  },
  'first-hackathon-experience': {
    title: 'My First Hackathon: Lessons Learned',
    date: '2024-08-01',
    author: 'Isaac Paha',
    coverImage: "/images/hackathon.jpg",
    excerpt: 'Reflections on participating in my first coding competition and what I gained from it.',
    content: [
      { type: 'text', content: 'After a few months of learning and practicing Python, I decided to push myself out of my comfort zone by participating in my first hackathon. The event was a 48-hour coding marathon where teams competed to build innovative solutions to real-world problems.' },
      { type: 'image', src: '/images/team-photo.jpg', alt: 'Hackathon Team', caption: 'My amazing team at the hackathon' },
      { type: 'text', content: 'Our project was a simple web application that helped connect local food banks with donors. Here\'s a snippet of the Python code we used for our backend:' },
      { type: 'code', language: 'python', content: `
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/donate', methods=['POST'])
def donate():
    data = request.json
    # Process donation data
    return jsonify({"message": "Donation received successfully!"}), 200
      `},
      { type: 'text', content: 'The experience was intense, challenging, and incredibly rewarding. I learned so much about teamwork, time management, and working under pressure. Most importantly, I realized that I still had a lot to learn, but I was on the right path.' },
      { type: 'quote', content: 'Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.', author: 'Patrick McKenzie' },
      { type: 'text', content: 'This hackathon was a turning point in my journey. It showed me the practical applications of programming and inspired me to continue pushing my boundaries.' },
    ]
  },
  
};

export async function generateStaticParams() {
  return Object.keys(blogPostsData).map((id) => ({
    blogId: id,
  }));
}

export default function BlogPostPage({ params }: { params: { blogId: string } }) {
  const post = blogPostsData[params.blogId];

  if (!post) notFound();

  return (
    <article className="container mx-auto px-4 py-12 mt-10 max-w-4xl">
      <Link href="/blog">
        <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Button>
      </Link>
   
      <div className="relative w-full h-64 md:h-96 mb-8">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          style={{objectFit: "cover"}}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="rounded-lg"
        />
      </div>
      
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-8">
        <span>{new Date(post.date).toLocaleDateString()}</span>
        <span className="mx-2">•</span>
        <span>{post.author}</span>
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        {post.content.map((block, index) => {
          switch (block.type) {
            case 'text':
              return <p key={index}>{block.content}</p>;
            case 'image':
              return (
                <figure key={index} className="my-8">
                  <Image src={block.src} alt={block.alt} width={800} height={400} className="rounded-lg" />
                  {block.caption && <figcaption className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{block.caption}</figcaption>}
                </figure>
              );
            case 'quote':
              return (
                <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic">
                  {block.content}
                  {block.author && <footer className="text-right mt-2">— {block.author}</footer>}
                </blockquote>
              );
            case 'code':
              return (
                <div key={index} className="my-6">
                  <CodeBlock language={block.language} content={block.content} />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}



// import { notFound } from 'next/navigation';
// import Link from 'next/link';
// import Image from 'next/image';
// import { ArrowLeft } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import dynamic from 'next/dynamic';

// const CodeBlock = dynamic(() => import('@/components/code-block'), { ssr: false });


// // Define types for different content blocks
// type ContentBlock = 
//   | { type: 'text'; content: string }
//   | { type: 'image'; src: string; alt: string; caption?: string }
//   | { type: 'quote'; content: string; author?: string }
//   | { type: 'code'; content: string; language: string };

// interface BlogPost {
//   title: string;
//   date: string;
//   author: string;
//   coverImage: string;
//   excerpt: string;
//   content: ContentBlock[];
// }

// // This data should ideally come from a database or API
// const blogPostsData: { [key: string]: BlogPost } = {
//   'introduction-to-react': {
//     title: 'Introduction to React',
//     date: '2023-07-01',
//     author: 'John Doe',
//     coverImage: "/images/background1.jpeg",
//     excerpt: 'Learn the basics of React and how to build your first component.',
//     content: [
//       { type: 'text', content: 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and has gained widespread adoption in the web development community.' },
//       { type: 'image', src: '/images/background1.jpeg', alt: 'React Component Structure', caption: 'Basic structure of a React component' },
//       { type: 'text', content: 'One of the key features of React is its component-based architecture. Components are the building blocks of React applications, allowing developers to create reusable UI elements.' },
//       { type: 'quote', content: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.', author: 'React Documentation' },
//       { type: 'text', content: 'Let\'s look at a simple example of a React component:' },
//       { type: 'code', language: 'jsx', content: `
        
// function Welcome(props) {
//   return <h1>Hello, {props.name}</h1>;
// }
//       `},
//       { type: 'text', content: 'This simple component takes a "name" prop and renders a greeting. React\'s simplicity and power lie in how easily you can compose these components to build complex UIs.' },
//     ]
//   },
//   'mastering-nextjs': {
//     title: 'Introduction to React',
//     date: '2023-07-01',
//     author: 'John Doe',
//     coverImage: "/images/background1.jpeg",
//     excerpt: 'Learn the basics of React and how to build your first component.',
//     content: [
//       { type: 'text', content: 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and has gained widespread adoption in the web development community.' },
//       { type: 'image', src: '/images/background1.jpeg', alt: 'React Component Structure', caption: 'Basic structure of a React component' },
//       { type: 'text', content: 'One of the key features of React is its component-based architecture. Components are the building blocks of React applications, allowing developers to create reusable UI elements.' },
//       { type: 'quote', content: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.', author: 'React Documentation' },
//       { type: 'text', content: 'Let\'s look at a simple example of a React component:' },
//       { type: 'code', language: 'jsx', content: `
        
// function Welcome(props) {
//   return <h1>Hello, {props.name}</h1>;
// }
//       `},
//       { type: 'text', content: 'This simple component takes a "name" prop and renders a greeting. React\'s simplicity and power lie in how easily you can compose these components to build complex UIs.' },
//     ]
//   },
//   'introduction-to-javascript': {
//     title: 'Introduction to React',
//     date: '2023-07-01',
//     author: 'John Doe',
//     coverImage: "/images/background1.jpeg",
//     excerpt: 'Learn the basics of React and how to build your first component.',
//     content: [
//       { type: 'text', content: 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and has gained widespread adoption in the web development community.' },
//       { type: 'image', src: '/images/background1.jpeg', alt: 'React Component Structure', caption: 'Basic structure of a React component' },
//       { type: 'text', content: 'One of the key features of React is its component-based architecture. Components are the building blocks of React applications, allowing developers to create reusable UI elements.' },
//       { type: 'quote', content: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.', author: 'React Documentation' },
//       { type: 'text', content: 'Let\'s look at a simple example of a React component:' },
//       { type: 'code', language: 'jsx', content: `
        
// function Welcome(props) {
//   return <h1>Hello, {props.name}</h1>;
// }
//       `},
//       { type: 'text', content: 'This simple component takes a "name" prop and renders a greeting. React\'s simplicity and power lie in how easily you can compose these components to build complex UIs.' },
//     ]
//   },
//   'introduction-to-python': {
//     title: 'Introduction to React',
//     date: '2023-07-01',
//     author: 'John Doe',
//     coverImage: "/images/background1.jpeg",
//     excerpt: 'Learn the basics of React and how to build your first component.',
//     content: [
//       { type: 'text', content: 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and has gained widespread adoption in the web development community.' },
//       { type: 'image', src: '/images/background1.jpeg', alt: 'React Component Structure', caption: 'Basic structure of a React component' },
//       { type: 'text', content: 'One of the key features of React is its component-based architecture. Components are the building blocks of React applications, allowing developers to create reusable UI elements.' },
//       { type: 'quote', content: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.', author: 'React Documentation' },
//       { type: 'text', content: 'Let\'s look at a simple example of a React component:' },
//       { type: 'code', language: 'jsx', content: `
        
// function Welcome(props) {
//   return <h1>Hello, {props.name}</h1>;
// }
//       `},
//       { type: 'text', content: 'This simple component takes a "name" prop and renders a greeting. React\'s simplicity and power lie in how easily you can compose these components to build complex UIs.' },
//     ]
//   },
//   // Add more blog posts here
// };

// export async function generateStaticParams() {
//   return Object.keys(blogPostsData).map((id) => ({
//     blogId: id,
//   }));
// }

// export default function BlogPostPage({ params }: { params: { blogId: string } }) {
//   const post = blogPostsData[params.blogId];

//   if (!post) notFound();

//   return (
//     <article className="container mx-auto px-4 py-12 mt-10 max-w-4xl">
//       <Link href="/blog">
//         <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors mb-8">
//           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
//         </Button>
//       </Link>
   
//       <div className="relative w-full h-64 md:h-96 mb-8">
//         <Image
//           src={post.coverImage}
//           alt={post.title}
//           fill
//           style={{objectFit: "cover"}}
//           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//           className="rounded-lg"
//         />
//       </div>
      
//       <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
//       <div className="flex items-center text-gray-500 dark:text-gray-400 mb-8">
//         <span>{new Date(post.date).toLocaleDateString()}</span>
//         <span className="mx-2">•</span>
//         <span>{post.author}</span>
//       </div>
      
//       <div className="prose dark:prose-invert max-w-none">
//         {post.content.map((block, index) => {
//           switch (block.type) {
//             case 'text':
//               return <p key={index}>{block.content}</p>;
//             case 'image':
//               return (
//                 <figure key={index} className="my-8">
//                   <Image src={block.src} alt={block.alt} width={800} height={400} className="rounded-lg" />
//                   {block.caption && <figcaption className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{block.caption}</figcaption>}
//                 </figure>
//               );
//             case 'quote':
//               return (
//                 <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic">
//                   {block.content}
//                   {block.author && <footer className="text-right mt-2">— {block.author}</footer>}
//                 </blockquote>
//               );
//               case 'code':
//                 return (
//                     <div key={index} className="my-6">
//                     <CodeBlock language={block.language} content={block.content} />
//                     </div>
//                 );
   
//             default:
//               return null;
//           }
//         })}
//       </div>
//     </article>
//   );
// }


// import { notFound } from 'next/navigation';
// import Link from 'next/link';
// import Image from 'next/image';
// import { ArrowLeft } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// // This data should ideally come from a database or API
// const blogPostsData: { [key: string]: { title: string; content: string; date: string; image: string } } = {
//   'introduction-to-react': {
//     title: 'Introduction to React',
//     content: 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and has gained widespread adoption in the web development community...',
//     date: '2023-07-01',
//     image: "/images/background1.jpeg",
//   },
//   'mastering-nextjs': {
//     title: 'Mastering Next.js',
//     content: 'Next.js is a powerful React framework that enables you to build server-side rendered and statically generated web applications. It provides a great developer experience with features like automatic code splitting, optimized performance, and easy deployment...',
//     date: '2023-07-15',
//     image: "/images/background1.jpeg",
//   },
//   // Add more blog posts here
// };

// export async function generateStaticParams() {
//   return Object.keys(blogPostsData).map((id) => ({
//     blogId: id,
//   }));
// }

// export default function BlogPostPage({ params }: { params: { blogId: string } }) {
//   const post = blogPostsData[params.blogId];

//   if (!post) notFound();

//   return (
//     <div className="container mx-auto px-4 py-12 mt-10">
//         <Link href="/">
//       <Button variant="outline" className="border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors m-4 mt-10">
//         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
//       </Button>
//       </Link>
   
//       <div className="relative w-full h-64 md:h-96 mb-8 mt-4">
//         <Image
//           src={post.image}
//           alt={post.title}
//           fill
//           style={{objectFit: "cover"}}
//           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//         />
//       </div>
//       <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
//       <p className="text-gray-500 dark:text-gray-400 mb-8">{new Date(post.date).toLocaleDateString()}</p>
//       <div className="prose dark:prose-invert max-w-none">
//         {post.content}
//       </div>
//     </div>
//   );
// }



// import { notFound } from 'next/navigation';
// import Link from 'next/link';
// import { ArrowLeft } from 'lucide-react';

// // This data should ideally come from a database or API
// const blogPostsData: { [key: string]: { title: string; content: string; date: string } } = {
//   'introduction-to-react': {
//     title: 'Introduction to React',
//     content: 'React is a popular JavaScript library for building user interfaces. It was developed by Facebook and has gained widespread adoption in the web development community...',
//     date: '2023-07-01',
//   },
//   'mastering-nextjs': {
//     title: 'Mastering Next.js',
//     content: 'Next.js is a powerful React framework that enables you to build server-side rendered and statically generated web applications. It provides a great developer experience with features like automatic code splitting, optimized performance, and easy deployment...',
//     date: '2023-07-15',
//   },
//   // Add more blog posts here
// };

// export async function generateStaticParams() {
//   return Object.keys(blogPostsData).map((id) => ({
//     blogId: id,
//   }));
// }

// export default function BlogPostPage({ params }: { params: { blogId: string } }) {
//   const post = blogPostsData[params.blogId];

//   if (!post) notFound();

//   return (
//     <div className="container mx-auto px-4 py-12">
//       <Link href="/blog" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6">
//         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
//       </Link>
//       <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
//       <p className="text-gray-500 dark:text-gray-400 mb-8">{new Date(post.date).toLocaleDateString()}</p>
//       <div className="prose dark:prose-invert max-w-none">
//         {post.content}
//       </div>
//     </div>
//   );
// }