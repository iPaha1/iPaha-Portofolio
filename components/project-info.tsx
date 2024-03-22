"use client";

import { ArrowRight, ShoppingCart } from "lucide-react";

// import Currency  from "@/components/ui/currency";
// import Button from "@/components/ui/button";
import { Product } from "@/types";
import { Button } from "./ui/button";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
// import useCart from "@/hooks/use-cart";

interface ProjectInfoProps {
  data: Product
};

const ProjectInfo: React.FC<ProjectInfoProps> = ({ data }) => {
  // const cart = useCart();

  const openProject = () => {
    window.open(data?.color?.name, "_blank"); // Open link in new tab
  }

  return ( 
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{data.name}</h1>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl text-gray-900">
          {/* <Currency value={data?.price} /> */}
        </p>
      </div>
      {/* <hr className="my-4" /> */}
      <div className="flex flex-col gap-y-6">
        <div className="flex items-center gap-x-4">
          {/* <h3 className="font-semibold text-black">Programs Used:</h3> */}
          <div>
            {data?.size?.value}
          </div>
        </div>
        {/* <div className="flex items-center gap-x-4">
          <h3 className="font-semibold text-black">Color:</h3>
          <div className="h-6 w-6 rounded-full border border-gray-600" style={{ backgroundColor: data?.color?.value }} />
        </div> */}
      </div>
      <div className="mt-10 flex items-center gap-x-3">
        <Button onClick={openProject} className="flex items-center gap-x-2 dark:hover:bg-slate-300">
          View live demo
          <ArrowTopRightIcon />
        </Button>
      </div>
    </div>
  );
}
 
export default ProjectInfo;