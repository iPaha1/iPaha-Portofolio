"use client";

import Image from "next/image";
import { MouseEventHandler } from "react";
import { useRouter } from "next/navigation";


import { Product } from "@/types";

interface ProductCard {
  data: Product
}

const ProductCard: React.FC<ProductCard> = ({
  data
}) => {
  
  const router = useRouter();

  const handleClick = () => {
    // router.push(`blog/${data?.id}`);
  };

  const onPreview: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();

  };

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();

  };
  
  
  return ( 
    <div onClick={handleClick} className=" text-black group cursor-pointer rounded-xl border p-3 space-y-4 dark:bg-black hover:bg-gray-300 dark:hover:bg-slate-950">
      {/* Image & actions */}
      <div className="aspect-square rounded-xl bg-gray-100 relative">
        <Image 
          src={data.images?.[0]?.url} 
          alt="" 
          fill
          className="aspect-square object-cover rounded-md"
        />
        
      </div>
      {/* Description */}
      {/* <p className="text-sm text-gray-700 ">{data.description}</p> */}

      <div className="flex justify-between">
        <p className="font-semibold text-lg dark:text-white">{data.name}</p>
        
      </div>
      {/* Price & Reiew */}
      <div className="flex items-center justify-between">
      </div>
      <div className="flex justify-between">
        {/* TODO: Date feature in the Admin Dashboard */}
        <p className="text-sm text-gray-500">1 March 2024</p>
        <p className="text-sm text-gray-500">{data.price} minutes</p>
      </div>
    </div>
  );
}

export default ProductCard;