// import ProductCard from "@/components/ui/product-card";
import { Product } from "@/types";
import NoResults from "./ui/no-results";
import ProjectCard from "./ui/project-card";
// import BlogCard from "./ui/project-card";
// import ProductCard from "./ui/product-card";
// import NoResults from "@/components/ui/no-results";

interface ProjectListProps {
  title: string;
  items: Product[]
}

const ProjectList: React.FC<ProjectListProps> = ({
  title,
  items
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-3xl">{title}</h3>
      {items.length === 0 && <NoResults />}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 dark:bg-black">
        {items.map((item) => (
            <ProjectCard key={item.id} data={item} />
        ))}
        
      </div>
    </div>
   );
}
 
export default ProjectList;