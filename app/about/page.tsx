import About from "./_about/about";

export const metadata = {
  title: "About - iPaha Portfolio",
  description: "Learn more about Isaac Paha, a Full-Stack Developer and Tech Entrepreneur.",
  path: "/about",
  keywords: ["Isaac Paha", "Full-Stack Developer", "Tech Entrepreneur"],
  type: "profile",
};

export default function AboutPage() {
  return (
    <div>
        <About />
    </div>
  );
}

