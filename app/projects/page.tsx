import Projects from "./_projects/projects";

export const metadata = {
    title: "Projects - iPaha Portfolio",
    description: "Explore the diverse projects and applications developed by Isaac Paha, a Full-Stack Developer and Tech Entrepreneur.",
    path: "/projects",
    keywords: ["Isaac Paha", "Projects", "Full-Stack Developer", "Tech Entrepreneur"],
    type: "website",
};

export default function ProjectsPage() {

    return (
        <div>
            <Projects />
        </div>
    )
}