import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

// Define the type for the post prop
interface RelatedPost {
  title: string;
  category: string;
  publishedAt: string | Date;
  readTime: number;
  slug: string;
  excerpt: string;
}

interface RelatedPostCardProps {
  post: RelatedPost;
  index: number;
}

// Related post card component
const RelatedPostCard: React.FC<RelatedPostCardProps> = ({ post, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <Card className="h-full bg-white border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
        
        {/* Post Image */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 rounded-t-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-3xl font-bold text-amber-500/30">
              {post.title.charAt(0)}
            </div>
          </div>
          
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs bg-white/80">
              {post.category}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(post.publishedAt).toLocaleDateString('en-GB')}</span>
            <span>•</span>
            <Clock className="w-3 h-3" />
            <span>{post.readTime} min</span>
          </div>
          
          <CardTitle className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors">
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
            {post.excerpt}
          </p>
          
          <Link href={`/blog/${post.slug}`}>
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-0 h-auto">
              Read More
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RelatedPostCard;