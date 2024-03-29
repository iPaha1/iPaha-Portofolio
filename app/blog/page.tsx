import getBillboard from "@/actions/get-billboards";
import getProducts from "@/actions/get-products";
import Billboard from "@/components/billboard";
import ProductList from "@/components/product-list";
import Container from "@/components/ui/container";

export const revalidate = 0;

const BlogPage = async () => {
    const products = await getProducts({ isFeatured: true });
    const billboard = await getBillboard("00003b66-ebb1-445c-aa7d-2d52742edf67");
    return (
        <Container>
          <div className="space-y-10 pb-10 text-white">
            <Billboard 
              data={billboard}
            />
            <div className="flex flex-col gap-y-8 px-4 sm:px-6 lg:px-8">
              <ProductList title="Recent Posts" items={products} />
            </div>
          </div>
        </Container>
      )
    };
    
    export default BlogPage;