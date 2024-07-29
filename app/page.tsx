import LandingPage from "@/components/landing-page";
import ProjectsSection from "@/components/projects";
import SkillsSection from "@/components/skills";
import AboutSection from "@/components/about-me";
import Container from "@/components/container";
import ContactMePage from "@/components/contact-me";


const HomePage = () => {
  return (
    <div className="space-y-10 pb-10">
      <LandingPage />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <Container >
      <ContactMePage />
      </Container>
      
    </div>
  );
}

export default HomePage;

// "use client";

// import { motion, useInView } from "framer-motion";
// import { useRef } from "react";
// import LandingPage from "@/components/landing-page";
// import ProjectsSection from "@/components/projects";
// import SkillsSection from "@/components/skills";
// import AboutSection from "@/components/about-me";
// import Container from "@/components/container";
// import ContactMePage from "@/components/contact-me";

// const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: true, amount: 0.1 });

//   return (
//     <motion.div
//       ref={ref}
//       initial={{ opacity: 0, y: 50 }}
//       animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
//       transition={{ duration: 0.5, delay: 0.2 }}
//     >
//       {children}
//     </motion.div>
//   );
// };

// const HomePage = () => {
//   return (
//     <div className="space-y-10 pb-10">
//       <LandingPage />
//       <AnimatedSection>
//         <AboutSection />
//       </AnimatedSection>
//       <AnimatedSection>
//         <ProjectsSection />
//       </AnimatedSection>
//       <AnimatedSection>
//         <SkillsSection />
//       </AnimatedSection>
//       <AnimatedSection>
//         <Container>
//           <ContactMePage />
//         </Container>
//       </AnimatedSection>
//     </div>
//   );
// }

// export default HomePage;