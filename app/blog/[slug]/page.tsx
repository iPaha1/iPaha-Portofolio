// app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug } from '@/lib/blog-posts';
import BlogPostClient from '../_blog/blog-client';


interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Isaac Paha Blog',
      description: 'The blog post you are looking for could not be found.',
    };
  }

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.image.src,
          width: 1200,
          height: 630,
          alt: post.image.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [post.image.src],
    },
    alternates: {
      canonical: `https://isaacpaha.com/blog/${slug}`,
    },
  };
}

// Generate static params for static generation (optional)
export async function generateStaticParams() {
  // You can import your blog posts and generate params
  // This is useful for static generation at build time
  return [
    { slug: 'from-student-to-tech-entrepreneur-my-computing-journey' },
    { slug: 'building-scalable-saas-platforms-lessons-from-serving-100k-users' },
  ];
}

// Main page component (Server Component)
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Check if post exists
  const post = getBlogPostBySlug(slug);
  
  if (!post) {
    notFound(); // This will show the 404 page
  }

  // Pass the slug to the client component
  return <BlogPostClient slug={slug} />;
}




// "use client";

// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import Link from 'next/link';
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import {
//   Copy,
//   CheckCircle,
//   User,
//   Tag,
//   Heart,
//   TrendingUp,
//   MessageCircle,
//   ArrowRight,
//   ExternalLink,
//   ArrowLeft,
//   Star,
//   Calendar,
//   Clock,
//   Bookmark,
 
// } from 'lucide-react';

// import { 
//   getBlogPostBySlug, 
//   getRelatedPosts,
//   type BlogPost 
// } from '@/lib/blog-posts';
// import ReadingProgress from '../_blog/reading progress';
// import ShareButton from '../_blog/share-button';
// import TableOfContents from '../_blog/table-of-content';
// import RelatedPostCard from '../_blog/related-post-card';


// // Main Blog Post Component
// interface BlogPostProps {
//   params: {
//     slug: string;
//   };
// }

// const BlogPost = ({ params }: BlogPostProps) => {
//   const [isBookmarked, setIsBookmarked] = useState(false);
//   const [isLiked, setIsLiked] = useState(false);
//   const [copySuccess, setCopySuccess] = useState(false);
//   const [likes, setLikes] = useState(42);

//   // Get the current URL
//   const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

//   // Get the blog post using the slug from params
//   const post = getBlogPostBySlug(params.slug);
  
//   if (!post) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
//           <p className="text-gray-600 mb-8">The blog post youre looking for doesnt exist.</p>
//           <Link href="/blog">
//             <Button className="bg-amber-500 hover:bg-amber-600">
//               <ArrowLeft className="w-4 h-4 mr-2" />
//               Back to Blog
//             </Button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const relatedPosts = getRelatedPosts(post);

//   // Process content to add IDs to headings
//   const processedContent = post.content.replace(
//     /<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/gi,
//     (match, level, attrs, text) => {
//       const id = text.replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
//       return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
//     }
//   );

//   const copyToClipboard = async () => {
//     try {
//       await navigator.clipboard.writeText(currentUrl);
//       setCopySuccess(true);
//       setTimeout(() => setCopySuccess(false), 2000);
//     } catch (err) {
//       console.error('Failed to copy: ', err);
//     }
//   };

//   const handleLike = () => {
//     setIsLiked(!isLiked);
//     setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       <ReadingProgress />

//       {/* Hero Section */}
//       <section className="relative py-12 px-4 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
//         <div className="absolute inset-0">
//           <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl animate-pulse"></div>
//           <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         </div>

//         <div className="relative z-10 max-w-4xl mx-auto">
//           {/* Navigation */}
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//             className="mb-8"
//           >
//             <Link href="/blog">
//               <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-0">
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back to Blog
//               </Button>
//             </Link>
//           </motion.div>

//           {/* Post Header */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="text-center mb-8"
//           >
//             {/* Category Badge */}
//             <div className="flex justify-center mb-4">
//               <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
//                 {post.category}
//               </Badge>
//               {post.featured && (
//                 <Badge variant="outline" className="ml-2 border-amber-500 text-amber-700">
//                   <Star className="w-3 h-3 mr-1" />
//                   Featured
//                 </Badge>
//               )}
//             </div>

//             {/* Title */}
//             <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
//               {post.title}
//             </h1>

//             {/* Subtitle */}
//             <p className="text-xl text-amber-600 font-medium mb-6">{post.subtitle}</p>

//             {/* Post Meta */}
//             <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600 mb-8">
//               <div className="flex items-center gap-2">
//                 <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
//                   <User className="w-5 h-5 text-white" />
//                 </div>
//                 <div className="text-left">
//                   <p className="font-medium text-gray-900">{post.author.name}</p>
//                   <p className="text-xs text-gray-500">{post.author.role}</p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-1">
//                   <Calendar className="w-4 h-4" />
//                   <span>
//                     {new Date(post.publishedAt).toLocaleDateString('en-GB', {
//                       year: 'numeric',
//                       month: 'long',
//                       day: 'numeric',
//                     })}
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-1">
//                   <Clock className="w-4 h-4" />
//                   <span>{post.readTime} min read</span>
//                 </div>

//                 <div className="flex items-center gap-1">
//                   <Heart className="w-4 h-4" />
//                   <span>{likes} likes</span>
//                 </div>
//               </div>
//             </div>

//             {/* Tags */}
//             <div className="flex flex-wrap justify-center gap-2 mb-8">
//               {post.tags.map((tag) => (
//                 <Badge
//                   key={tag}
//                   variant="outline"
//                   className="text-gray-600 border-gray-300 hover:border-amber-300 hover:text-amber-700"
//                 >
//                   <Tag className="w-3 h-3 mr-1" />
//                   {tag}
//                 </Badge>
//               ))}
//             </div>

//             {/* Action Buttons */}
//             <div className="flex flex-wrap justify-center gap-3">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleLike}
//                 className={`${isLiked ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-300'} hover:scale-105 transition-transform`}
//               >
//                 <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
//                 {isLiked ? 'Liked' : 'Like'} ({likes})
//               </Button>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setIsBookmarked(!isBookmarked)}
//                 className={`${isBookmarked ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-300'} hover:scale-105 transition-transform`}
//               >
//                 <Bookmark className={`w-4 h-4 mr-1 ${isBookmarked ? 'fill-current' : ''}`} />
//                 {isBookmarked ? 'Saved' : 'Save'}
//               </Button>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={copyToClipboard}
//                 className="border-gray-300 hover:scale-105 transition-transform"
//               >
//                 {copySuccess ? (
//                   <>
//                     <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
//                     Copied!
//                   </>
//                 ) : (
//                   <>
//                     <Copy className="w-4 h-4 mr-1" />
//                     Copy Link
//                   </>
//                 )}
//               </Button>

//               <div className="flex gap-1">
//                 <ShareButton platform="twitter" url={currentUrl} title={post.title} className="border-blue-300 text-blue-600 hover:bg-blue-50" />
//                 <ShareButton platform="linkedin" url={currentUrl} title={post.title} className="border-blue-700 text-blue-700 hover:bg-blue-50" />
//                 <ShareButton platform="facebook" url={currentUrl} title={post.title} className="border-blue-600 text-blue-600 hover:bg-blue-50" />
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* Main Content */}
//       <section className="py-12 px-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            
//             {/* Table of Contents - Left Sidebar */}
//             <div className="hidden lg:block">
//               <TableOfContents content={post.content} />
//             </div>

//             {/* Article Content */}
//             <div className="lg:col-span-2">
//               <motion.article
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.8 }}
//                 className="prose prose-lg prose-gray max-w-none"
//                 style={{
//                   fontSize: '18px',
//                   lineHeight: '1.8',
//                   color: '#374151',
//                 }}
//               >
//                 <div
//                   dangerouslySetInnerHTML={{ __html: processedContent }}
//                   className="prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:mt-8 prose-h3:mb-4 prose-p:mb-6 prose-ul:mb-6 prose-ol:mb-6 prose-li:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:bg-amber-50 prose-blockquote:p-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-a:text-amber-600 prose-a:no-underline hover:prose-a:text-amber-700 hover:prose-a:underline prose-strong:text-gray-900"
//                 />
//               </motion.article>

//               {/* Post Footer */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: 0.5 }}
//                 className="mt-12 pt-8 border-t border-gray-200"
//               >
//                 {/* Tags */}
//                 <div className="mb-8">
//                   <h4 className="text-lg font-semibold text-gray-900 mb-4">Topics covered in this article:</h4>
//                   <div className="flex flex-wrap gap-2">
//                     {post.tags.map((tag) => (
//                       <Badge
//                         key={tag}
//                         variant="outline"
//                         className="text-gray-600 border-gray-300 hover:border-amber-300 hover:text-amber-700 cursor-pointer"
//                       >
//                         <Tag className="w-3 h-3 mr-1" />
//                         {tag}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Share Again */}
//                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-amber-50 rounded-lg border border-amber-200">
//                   <div>
//                     <h4 className="font-semibold text-gray-900 mb-1">Found this article helpful?</h4>
//                     <p className="text-sm text-gray-600">Share it with your network and help others learn too!</p>
//                   </div>
//                   <div className="flex gap-2">
//                     <ShareButton platform="twitter" url={currentUrl} title={post.title} />
//                     <ShareButton platform="linkedin" url={currentUrl} title={post.title} />
//                     <ShareButton platform="facebook" url={currentUrl} title={post.title} />
//                   </div>
//                 </div>
//               </motion.div>
//             </div>

//             {/* Right Sidebar */}
//             <div className="space-y-8">
//               {/* Author Info */}
//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.8, delay: 0.2 }}
//               >
//                 <Card className="border border-gray-200 shadow-sm sticky top-8">
//                   <CardHeader>
//                     <CardTitle className="text-lg font-semibold text-gray-900">About the Author</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="flex items-start gap-4 mb-4">
//                       <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
//                         <User className="w-8 h-8 text-white" />
//                       </div>
//                       <div>
//                         <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
//                         <p className="text-sm text-amber-600 mb-2">{post.author.role}</p>
//                       </div>
//                     </div>
//                     <p className="text-sm text-gray-600 mb-4 leading-relaxed">{post.author.bio}</p>
//                     <div className="flex gap-2">
//                       <Link href="/about">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           className="border-amber-300 text-amber-700 hover:bg-amber-50"
//                         >
//                           View Profile
//                         </Button>
//                       </Link>
//                       <Link href="/contact">
//                         <Button
//                           size="sm"
//                           className="bg-amber-500 hover:bg-amber-600 text-white"
//                         >
//                           Contact
//                         </Button>
//                       </Link>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Newsletter Signup */}
//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.8, delay: 0.4 }}
//               >
//                 <Card className="border border-amber-200 bg-amber-50 shadow-sm">
//                   <CardHeader>
//                     <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//                       <MessageCircle className="w-5 h-5 text-amber-500" />
//                       Stay Updated
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-sm text-gray-600 mb-4">
//                       Get notified when I publish new articles about tech entrepreneurship and scalable development.
//                     </p>
//                     <div className="space-y-3">
//                       <input
//                         type="email"
//                         placeholder="Enter your email"
//                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                       />
//                       <Button
//                         size="sm"
//                         className="w-full bg-amber-500 hover:bg-amber-600 text-white"
//                       >
//                         Subscribe
//                       </Button>
//                     </div>
//                     <p className="text-xs text-gray-500 mt-2">No spam, unsubscribe anytime.</p>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Related Posts */}
//       {relatedPosts.length > 0 && (
//         <section className="py-16 px-4 bg-gray-50">
//           <div className="max-w-6xl mx-auto">
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8 }}
//               viewport={{ once: true }}
//               className="text-center mb-12"
//             >
//               <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Related Articles</h2>
//               <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//                 Continue your learning journey with these related insights.
//               </p>
//             </motion.div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {relatedPosts.map((relatedPost, index) => (
//                 <RelatedPostCard key={relatedPost.id} post={relatedPost} index={index} />
//               ))}
//             </div>
//           </div>
//         </section>
//       )}

//       {/* Call to Action */}
//       <section className="py-20 px-4 bg-gradient-to-r from-amber-50 to-amber-100/50">
//         <div className="max-w-4xl mx-auto text-center">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             viewport={{ once: true }}
//           >
//             <TrendingUp className="w-16 h-16 text-amber-500 mx-auto mb-6" />
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               Ready to Start Your Tech Journey?
//             </h2>
//             <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
//               Whether you need help building scalable platforms, want to discuss entrepreneurship, or explore
//               collaboration opportunities, I&apos;d love to hear from you.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Link href="/contact">
//                 <Button
//                   size="lg"
//                   className="bg-amber-500 hover:bg-amber-600 text-white"
//                 >
//                   Get In Touch
//                   <ArrowRight className="w-5 h-5 ml-2" />
//                 </Button>
//               </Link>
//               <Link href="/projects">
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="border-amber-300 text-amber-700 hover:bg-amber-50"
//                 >
//                   View My Work
//                   <ExternalLink className="w-5 h-5 ml-2" />
//                 </Button>
//               </Link>
//             </div>
//           </motion.div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default BlogPost;