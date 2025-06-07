

"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 

  User,
  Tag,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Eye,
  MessageCircle,

  Rss
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  getBlogPosts, 
//   getFeaturedPosts, 
  getAllCategories, 
  getAllTags,
} from '@/lib/blog-posts';
import BlogPostCard from './blog-card';


// Main Blog component
const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("");

  const allPosts = getBlogPosts();
//   const featuredPosts = getFeaturedPosts();
  const categories = ["All", ...getAllCategories()];
  const tags = getAllTags();

  // Filter posts based on search and filters
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
                Isaac&apos;s Blog
              </h1>
            </motion.div>
            
            <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Insights from my journey as a Computing & IT graduate and tech entrepreneur. 
              Learn about building scalable platforms, startup challenges, and the intersection of education and innovation.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-sm py-2 px-4">
                <TrendingUp className="w-4 h-4 mr-2" />
                Tech Entrepreneur
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-sm py-2 px-4">
                <BookOpen className="w-4 h-4 mr-2" />
                Computing & IT Graduate
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-sm py-2 px-4">
                <Eye className="w-4 h-4 mr-2" />
                100K+ Users Served
              </Badge>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] border-gray-300 focus:border-amber-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[180px] border-gray-300 focus:border-amber-500">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Tags</SelectItem>
                  {tags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory !== "All" || selectedTag) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setSelectedTag("");
                  }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Clear All
                </Button>
              )}

              {/* RSS Feed */}
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 ml-auto"
              >
                <Rss className="w-4 h-4 mr-2" />
                RSS Feed
              </Button>
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm text-gray-600"
          >
            {filteredPosts.length === allPosts.length 
              ? `Showing all ${allPosts.length} articles` 
              : `Showing ${filteredPosts.length} of ${allPosts.length} articles`
            }
          </motion.div>
        </div>
      </section>

      {/* All Posts Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {searchTerm || selectedCategory !== "All" || selectedTag 
                ? "Search Results" 
                : "All Articles"
              }
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore insights from my journey building tech companies and developing scalable platforms.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {filteredPosts.length > 0 ? (
              <motion.div
                key="posts-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredPosts.map((post, index) => (
                  <BlogPostCard key={post.id} post={post} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or clearing the filters.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setSelectedTag("");
                  }}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  View All Articles
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-50 to-amber-100/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Stay Updated
              </h2>
            </div>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get notified when I publish new articles about tech entrepreneurship, 
              scalable development, and lessons from building platforms that serve 100K+ users.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-8">
              <Input
                placeholder="Enter your email address"
                className="flex-1 border-gray-300 focus:border-amber-500"
              />
              <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                Subscribe
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              No spam, unsubscribe at any time. Join 1000+ developers and entrepreneurs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Author Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="border border-gray-200 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full p-1">
                      <Image
                        src="/images/photo1.png"
                        alt="Isaac Paha"
                        width={88}
                        height={88}
                        className="rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-full p-2">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Isaac Paha</h3>
                    <p className="text-amber-600 font-medium mb-4">
                      Computing & IT Graduate | Tech Entrepreneur | Full-Stack Developer
                    </p>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Founder of three successful tech companies serving 100K+ users across the UK and Ghana. 
                      Currently completing Computing & IT degree at Open University London while building 
                      scalable platforms that solve real-world problems.
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <Link href="/about">
                        <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                          Learn More About Me
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      
                      <Link href="/contact">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                          Get In Touch
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Explore Topics</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover articles organized by categories that matter to developers and entrepreneurs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(cat => cat !== "All").map((category, index) => {
              const categoryPosts = allPosts.filter(post => post.category === category);
              const categoryIcon = category === "Entrepreneurship" ? TrendingUp : 
                                 category === "Technology" ? Eye : BookOpen;
              const IconComponent = categoryIcon;
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full bg-white border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedCategory(category)}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900">{category}</CardTitle>
                      </div>
                      <CardDescription>
                        <span className="text-sm text-gray-600">
                          {categoryPosts.length} article{categoryPosts.length !== 1 ? 's' : ''} available
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        {category === "Entrepreneurship" 
                          ? "Insights from building three successful tech companies and lessons learned along the way."
                          : "Deep technical insights from scaling platforms to serve 100K+ users across multiple countries."
                        }
                      </p>
                      <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-0">
                        Explore {category}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;