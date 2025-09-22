import Contact from "./_contact/contact";

export const metadata = {
  title: "Contact - iPaha Portfolio",
  description: "Get in touch with Isaac Paha, a Full-Stack Developer and Tech Entrepreneur.",
  path: "/contact",
  keywords: ["Isaac Paha", "Contact", "Full-Stack Developer", "Tech Entrepreneur"],
  type: "profile",
};

export default function ContactPage() {
  return (
    <div>
      <Contact />
    </div>
  );
}

