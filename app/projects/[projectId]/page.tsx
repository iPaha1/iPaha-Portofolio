// import ProductList from '@/components/product-list'
import getProduct from '@/actions/get-product';
import getProducts from '@/actions/get-products';
// import Container from '@/components/ui/container';
import Gallery from '@/components/gallery';
import ProjectInfo from '@/components/project-info';
import Container from '@/components/ui/ProjectContainer';


export const revalidate = 0;

interface ProjectIdPageProps {
  params: {
    projectId: string;
  },
}

const ProjectIdPage: React.FC<ProjectIdPageProps> = async ({ 
  params
 }) => {
  const product = await getProduct(params.projectId);
  const suggestedProducts = await getProducts({ 
    categoryId: product?.category?.id
  });

  if (!product) {
    return null;
  }

  return (
    <div className="bg-white mt-20 dark:bg-black">
      <Container>
        <div className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            <Gallery images={product.images} />
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <ProjectInfo data={product} />
            </div>
          </div>
          <hr className="my-10" />
          
          {/* <ProjectList title="Related Blogs" items={suggestedProducts} /> */}
        </div>
      </Container>
      {/* Description */}
      <p className="text-xl m-10">{product.description}</p>
    </div>  
  )
}

export default ProjectIdPage;