import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

import { MenuIcon, User } from "lucide-react";
import Link from "next/link";
import Logo from "./logo";
import { ModeToggle } from "./theme-toggle";

  

const MobileNav = () => {
    return ( 
        <div className="md:hidden">
            <ModeToggle />
            <Sheet>
                <SheetTrigger>
                    <MenuIcon className="w-6 h-6 mr-4 ml-4" />
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                    {/* <SheetTitle>Are you absolutely sure?</SheetTitle> */}
                    <SheetDescription>
                    <div className="flex gap-x-2">
                            <Link href="/">
                                <Logo />
                            </Link>
                            
                        </div>

                    <Accordion type="single" collapsible className="w-full mt-5">
                        <AccordionItem value="item-1">
                            <AccordionTrigger
                                className=" text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p>About me</p>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Link href="/about-me">
                                <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                    My journey
                                </div>
                                </Link>

                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger
                                className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p >Projects</p>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Link href="/projects">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Veiw my projects
                                    </div>
                                    </Link>
 
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger
                                className=" text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p>Blog</p>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Link href="/blog">
                                <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                    Explore my blog posts
                                </div>
                                </Link>

                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-4">
                        <AccordionTrigger
                                className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p >Partner with me</p>
                            </AccordionTrigger>
                            <AccordionContent>
                            <Link href="/contact-me">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Get in touch
                                    </div>
                                    </Link>

                            </AccordionContent>
                        </AccordionItem>
                        
                    </Accordion>

                    </SheetDescription>
                    </SheetHeader>
                </SheetContent>
                </Sheet>
        </div>
     );
}
 
export default MobileNav;