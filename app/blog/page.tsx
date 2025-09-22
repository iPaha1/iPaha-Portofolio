import Blog from "./_blog/blog";

export const metadata = {
  title: "Blog - iPaha Portfolio",
  description: "Read the latest articles and updates from Isaac Paha, a Full-Stack Developer and Tech Entrepreneur.",
  path: "/blog",
  keywords: ["Isaac Paha", "Blog", "Full-Stack Developer", "Tech Entrepreneur"],
  type: "article",
};

export default function BlogPage() {
  return (
    <div>
      <Blog />
    </div>
  );
}
