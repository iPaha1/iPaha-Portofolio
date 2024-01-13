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

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import Logo from "./logo";
import { ModeToggle } from "./theme-toggle";

  

const MobileNav = () => {
    return ( 
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger>
                    <MenuIcon className="w-6 h-6 mr-4" />
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
                            <p>Services</p>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Link href="/services">
                                <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                Our prices are well structured.
                                </div>
                                </Link>

                                <Link href="/view-all-services">
                                <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                View all our offers and services.
                                </div>
                                </Link>

                                <Link href="/">
                                <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                Partner with me.
                                </div>
                                </Link>

                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger
                                className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p >Projects</p>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Link href="/services">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Admin Dashboard
                                    </div>
                                    </Link>

                                    <Link href="/">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Advance Eccommence
                                    </div>
                                    </Link>

                                    <Link href="/">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Event Management System
                                    </div>
                                   
                                    </Link>

                                    <Link href="/">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Advance Blogging Website.
                                    </div>
                                    </Link>

                                    <Link href="/">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Advanced SAAS Application
                                    </div>
                                </Link>

                                <Link href="/">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        View all projects
                                    </div>
                                </Link>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                        <AccordionTrigger
                                className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p >About Me</p>
                            </AccordionTrigger>
                            <AccordionContent>
                            <Link href="/">
                                    <div className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                                        Visit my page
                                    </div>
                                    </Link>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                        <AccordionTrigger
                                className="text-gray-700 text-lg hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1"
                            >
                            <p >Contact Me</p>
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
                    <ModeToggle />
                    </SheetHeader>
                </SheetContent>
                </Sheet>
        </div>
     );
}
 
export default MobileNav;