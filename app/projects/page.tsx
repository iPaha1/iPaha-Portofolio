import getBillboard from "@/actions/get-billboards";
import getProducts from "@/actions/get-products";
import Billboard from "@/components/billboard";
import ProjectList from "@/components/project-list";
// import BlogList from "@/components/project-list";
// import ProductList from "@/components/blog-list";
// import ProductList from "@/components/product-list";
import Container from "@/components/ui/container";

export const revalidate = 0;

const ProjectsPage = async () => {
    const products = await getProducts({ isFeatured: true });
    const billboard = await getBillboard("e611b28d-57e3-4377-a653-34f034ea0365");
    return (
        <Container>
          <div className="space-y-10 pb-10 text-black dark:text-white">
            <Billboard 
              data={billboard}
            />
            <div className="flex flex-col gap-y-8 px-4 sm:px-6 lg:px-8">
              <ProjectList title="Recent Projects" items={products} />
            </div>
          </div>
        </Container>
      )
    };
    
    export default ProjectsPage;
  