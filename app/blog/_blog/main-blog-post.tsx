import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Tag, Heart, MessageCircle, TrendingUp, ArrowRight, ExternalLink, ArrowLeft } from 'lucide-react';
import ShareButton from './share-button';
import TableOfContents from './table-of-content';
import RelatedPostCard from './related-post-card';

// Main Blog Post Component
interface Author {
  name: string;
  role: string;
  bio: string;
}

interface Post {
  content: string;
  tags: string[];
  title: string;
  author: Author;
  readTime: number;
  publishedAt: string;
  category: string;
}

interface RelatedPost {
  id: string | number;
  title: string;
  category: string;
  publishedAt: string;
  readTime: number;
  slug: string;
  excerpt: string;
  // Add any other required properties here
  [key: string]: unknown;
}

interface BlogPostProps {
  post: Post;
  processedContent: string;
  likes: number;
  relatedPosts: RelatedPost[];
}

const BlogPost: React.FC<BlogPostProps> = ({ post, processedContent, likes, relatedPosts }) => {
  const router = useRouter();
  const currentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${router.asPath}`;

  return (
    <div>
      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Table of Contents - Left Sidebar */}
            <div className="hidden lg:block">
              <TableOfContents content={post.content} />
            </div>

            {/* Article Content */}
            <div className="lg:col-span-2">
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="prose prose-lg prose-gray max-w-none"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.8',
                  color: '#374151',
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                  className="prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:mt-8 prose-h3:mb-4 prose-p:mb-6 prose-ul:mb-6 prose-ol:mb-6 prose-li:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:bg-amber-50 prose-blockquote:p-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-a:text-amber-600 prose-a:no-underline hover:prose-a:text-amber-700 hover:prose-a:underline prose-strong:text-gray-900"
                />
              </motion.article>

              {/* Post Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 pt-8 border-t border-gray-200"
              >
                {/* Tags */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Topics covered in this article:</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-gray-600 border-gray-300 hover:border-amber-300 hover:text-amber-700 cursor-pointer">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Share Again */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Found this article helpful?</h4>
                    <p className="text-sm text-gray-600">Share it with your network and help others learn too!</p>
                  </div>
                  <div className="flex gap-2">
                    <ShareButton platform="twitter" url={currentUrl} title={post.title} />
                    <ShareButton platform="linkedin" url={currentUrl} title={post.title} />
                    <ShareButton platform="facebook" url={currentUrl} title={post.title} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              {/* Author Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="border border-gray-200 shadow-sm sticky top-8">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">About the Author</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
                        <p className="text-sm text-amber-600 mb-2">{post.author.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {post.author.bio}
                    </p>
                    <div className="flex gap-2">
                      <Link href="/about">
                        <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                          View Profile
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                          Contact
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Article Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Reading time</span>
                        <span className="text-sm font-medium text-gray-900">{post.readTime} minutes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Published</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(post.publishedAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Category</span>
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Likes</span>
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {likes}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Newsletter Signup */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-amber-500" />
                      Stay Updated
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Get notified when I publish new articles about tech entrepreneurship and scalable development.
                    </p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                        Subscribe
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      No spam, unsubscribe anytime.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Related Articles</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Continue your learning journey with these related insights.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost, index) => (
                <RelatedPostCard key={relatedPost.id} post={relatedPost} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-50 to-amber-100/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <TrendingUp className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Start Your Tech Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Whether you need help building scalable platforms, want to discuss entrepreneurship,
              or explore collaboration opportunities, I&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                  Get In Touch
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  View My Work
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Back to Top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 rotate-90" />
        </Button>
      </motion.div>
    </div>
  );
};

export default BlogPost;