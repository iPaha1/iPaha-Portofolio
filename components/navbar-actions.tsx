"use client";

import { ShoppingCart, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Category } from "@/types";
import MobileNav from "./mobile-nav";



const NavbarActions = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();


 

  

  return ( 
    <div className="ml-auto flex items-center ">
     
      
      <MobileNav  />
    </div>
  );
}

export default NavbarActions;


// "use client";

// import { ShoppingCart, User } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import useCart from "@/hooks/use-cart";
// import { Button } from "./ui/button";
// import MobileNav from "./mobile-menu";
// import { Category, Customer } from "@/types";
// import { UserButton } from "@clerk/nextjs";


// interface NavbarActionsProps {
//   customer: Customer | null;
//   categories: Category[];
//   onMenuOpen?: () => void;
//   onMenuClose?: () => void;
// }

// const NavbarActions: React.FC<NavbarActionsProps> = ({ categories, customer, onMenuOpen, onMenuClose }) => {
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);
  
//   const router = useRouter();
//   const cart = useCart();

//   if (!isMounted) {
//     return null;
//   }

//   // const handleAccountClick = () => {
//   //   if (customer && customer.id) {
//   //     router.push(`/account/${customer.id}`);
//   //   } else {
//   //     // Redirect to sign-in page if no customer data
//   //     router.push('/sign-in');
//   //   }
//   // };

//   const handleAccountClick = () => {
//     router.push('/account');
// };

//   return ( 
//     <div className="ml-auto flex items-center ">
//       <Button variant="totalGhost" onClick={() => router.push('/cart')} className="md:ml-10 flex items-center py-2 hover:scale-105 bg-white">
//         <ShoppingCart
//           size={20}
//           color="black"
//         />
//         <span className="ml-1 text-sm font-medium text-black">
//           {cart.items.length}
//         </span>
//       </Button>
//       <Button variant="totalGhost" onClick={() => router.push('/account')} className="items-center py-2 hover:scale-105 bg-white">
//         <User size={20} color="black" />
//       </Button>
//       <UserButton />
//       <MobileNav data={categories} onOpen={onMenuOpen} onClose={onMenuClose} />
//     </div>
//   );
// }

// export default NavbarActions;








// "use client";

// import { HeartIcon, Menu, ShoppingBag, ShoppingCart, User } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// import useCart from "@/hooks/use-cart";
// import { Button } from "./ui/button";
// import useFavourate from "@/hooks/use-favourate";
// import MobileNav from "./mobile-menu";


// const NavbarActions = () => {
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);
  

//   const router = useRouter();
//   const cart = useCart();
//   const favourate = useFavourate();

//   if (!isMounted) {
//     return null;
//   }

//   return ( 
//     <div className="ml-auto flex items-center">
//       {/* <Button onClick={() => router.push('/favourates')} className="flex items-center px-4 py-2 hover:scale-105">
//         <HeartIcon
//           size={20}
//           color="black"
//           // fill="white"
//         />
//         <span className="ml-2 text-sm font-medium text-black">
//           {favourate.items.length}
//         </span>
//       </Button> */}
//       <Button onClick={() => router.push('/cart')} className="md:ml-10 flex items-center py-2 hover:scale-105">
//         <ShoppingCart
//           size={20}
//           color="black"
//         />
//         <span className="ml-1 text-sm font-medium text-black">
//           {cart.items.length}
//         </span>
//       </Button>
//       <Button onClick={() => router.push('/')} className="items-center py-2 hover:scale-105">
//         <User size={20}
//           color="black"
//         />
      
//       </Button>
      
//       {/* <Button onClick={() => router.push('/')} className="md:hidden flex items-center px-4 py-2 hover:scale-105">
//         <Menu size={20}
//           color="black"
//         />
//       </Button> */}
//       <MobileNav />
      
      
//     </div>
//   );
// }
 
// export default NavbarActions;