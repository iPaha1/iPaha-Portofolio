import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Clock, User, Star, ArrowRight } from 'lucide-react';

// Blog post card component
interface BlogPostAuthor {
  name: string;
  role: string;
}

interface BlogPost {
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  tags: string[];
  slug: string;
  publishedAt: string | Date;
  readTime: number;
  featured?: boolean;
  author: BlogPostAuthor;
}

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
  index?: number;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, featured = false, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group ${featured ? 'md:col-span-2' : ''}`}
    >
      <Card className="h-full bg-white border border-gray-200 hover:border-amber-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
        
        {/* Post Image */}
        <div className={`relative overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 ${featured ? 'h-64' : 'h-48'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-amber-500/30">
              {post.title.charAt(0)}
            </div>
          </div>
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
              {post.category}
            </Badge>
          </div>

          {/* Featured Badge */}
          {post.featured && (
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="bg-white/90 border-amber-500 text-amber-700">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}

          {/* Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <Link href={`/blog/${post.slug}`}>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Read Article
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4" />
            <span>{new Date(post.publishedAt).toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span>•</span>
            <Clock className="w-4 h-4" />
            <span>{post.readTime} min read</span>
          </div>
          
          <CardTitle className={`${featured ? 'text-2xl' : 'text-xl'} font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2`}>
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </CardTitle>
          
          <CardDescription className="text-amber-600 font-medium">
            {post.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Author & Read More */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                <p className="text-xs text-gray-500">{post.author.role}</p>
              </div>
            </div>
            
            <Link href={`/blog/${post.slug}`}>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                Read More
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BlogPostCard;