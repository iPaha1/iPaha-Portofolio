import Image from 'next/image';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
}

interface BlogProps {
  posts: BlogPost[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <Link href={`/blog/${post.id}`}>
            <div className="relative h-48 w-full">
              <Image
                src={post.image}
                alt={post.title}
                fill
                style={{objectFit: "cover"}}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </Link>
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-2">
              <Link href={`/blog/${post.id}`} className="hover:underline font-semibold">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Blog;