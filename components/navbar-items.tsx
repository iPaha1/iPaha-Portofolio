"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
// import { Icons } from "@/components/icons"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Logo from "./logo"
import MobileNav from "./mobile-nav"
import { ModeToggle } from "./theme-toggle"
import path from "path"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
// import MotionNavbarItems from "./motions/navbarItemsNavbarItems/motion-navbarItemsNavbarItems"


const components: { title: string; href: string; description: string }[] = [
  {
    title: "Advanced Admin Dashboard",
    href: "https://i-paha-store-admin.vercel.app/",
    description:
      "A complete multi functional admin dashboard which can be used for all types of web applications.",
  },
  {
    title: "Advanced Ecommerce Website",
    href: "https://i-paha-store.vercel.app/",
    description:
      "Advance Ecommerce Website with Next.js and Stripe API for payment processing.",
  },
  {
    title: "Event Booking and Management System",
    href: "https://i-paha-events.vercel.app/",
    description:
      "Advance event booking and management website with Next.js and Stripe API for payment processing.",
  },
  {
    title: "Advance Blogging Website",
    href: "/view-all-projects",
    description: "Advance blogging website with notificaiton system and user authentication system.",
  },
  {
    title: "Advance AI SAAS Platforn",
    href: "/view-all-projects",
    description:
      "Advanc AI SAAS platform with user authentication system.",
  },
  {
    title: "View All Projects",
    href: "/view-all-projects",
    description:
      "View all projects and services.",
  },
]

const aboutMeComponents: { title: string; href: string; description: string }[] = [
  {
    title: "Skills",
    href: "/education-experience-skills",
    description:
      "I have a wide range of skills and experience in web development, design, digital marketing, SEO, APIs and more.",
  },
  {
    title: "Experience",
    href: "/education-experience-skills",
    description:
      "I have worked with a wide range of companies and clients, from small startups to large corporations.",
  },
  {
    title: "Education",
    href: "/education-experience-skills",
    description:
      "I have a Bachelor's degree in Computering and IT from The Open University, London.",
  },
  {
    title: "Contact Me",
    href: "/contact-me",
    description: "Contact me for more information or to discuss your project.",
  },
  {
    title: "My Journey",
    href: "/my-journey",
    description: "I have a passion for innovation and I am always looking for new challenges and opportunities.",
  },
  
]

export function NavbarItems() {
  
  const pathname = usePathname();

  return (
    <div className="h-16 sm:px-6 lg:px-8 top-0 flex justify-between items-center">
      <div className="flex gap-x-2">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div>
      <NavigationMenu>
        <NavigationMenuList
          className="hidden md:flex md:space-x-4 md:items-center"
        >
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "dark:hidden data-[state=open]:bg-gray-300 hover:bg-gray-300 hover:rounded-lg duration-3",
                navigationMenuTriggerStyle, pathname === "/pricing" ? "bg-gray-300" : ""
              )}
            >Services</NavigationMenuTrigger>

          <NavigationMenuTrigger
              className={cn(
                "hidden dark:flex hover:rounded-lg duration-3",
              )}
            >Services</NavigationMenuTrigger>
            
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] text-gray-700 hover:bg-gray-300 hover:rounded-lg duration-300 px-2 py-1">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      {/* <Icons.logo className="h-6 w-6" /> */}
                      <Logo />
                      <div className="mb-2 mt-4 text-lg font-medium">
                        Limitless possibilities
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Our services are designed to help you achieve your goals and objectives.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <ListItem href="/pricing" title="Pricing" className={cn("", pathname === "/pricing" ? "bg-gray-300" : "")}>
                  Our prices are well structured and affordable.
                </ListItem>
                <ListItem href="/view-all-services" title="View all services" className={cn("", pathname === "/view-all-services" ? "bg-gray-300" : "")}>
                  View all our offers and services.
                </ListItem>
                <ListItem href="/contact-me" title="Partner with Me" className={cn("", pathname === "/contact-me" ? "bg-gray-300" : "")}>
                  Partner with me for the next level of innovation.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
          <NavigationMenuTrigger
              className={cn(
                "dark:hidden data-[state=open]:bg-gray-300 hover:bg-gray-300 hover:rounded-lg duration-3",
                navigationMenuTriggerStyle, pathname === "/view-all-projects" ? "bg-gray-300" : ""
              )}
            >Projects</NavigationMenuTrigger>

          <NavigationMenuTrigger
              className={cn(
                "hidden dark:flex hover:rounded-lg duration-3",
                navigationMenuTriggerStyle, pathname === "/view-all-projects" ? "bg-gray-950" : ""
              )}
            >Projects</NavigationMenuTrigger>
            
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] text-gray-700 hover:bg-gray-300 hover:rounded-lg duration-300 px-2 py-1">
                {components.map((component) => (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
          <NavigationMenuTrigger
              className={cn(
                "dark:hidden data-[state=open]:bg-gray-300 hover:bg-gray-300 hover:rounded-lg duration-3",
                navigationMenuTriggerStyle, pathname === "/education-experience-skills" && "/contact-me" ? "bg-gray-300" : ""
              )}
            >About Me</NavigationMenuTrigger>

          <NavigationMenuTrigger
              className={cn(
                "hidden dark:flex hover:rounded-lg duration-3",
                navigationMenuTriggerStyle, pathname ===  "/education-experience-skills" && "/contact-me" ? "bg-gray-950" : ""
              )}

            >About Me</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] text-gray-700 hover:bg-gray-300 hover:rounded-lg duration-300 px-2 py-1">
                {aboutMeComponents.map((component) => (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
          <Link href="/blog" legacyBehavior passHref>
            <NavigationMenuLink className="{navigationMenuTriggerStyle()}">
              <p className={cn("ml-8", pathname === "/blog" ? "animate-pulse text-lg text-blod" : " ")}>Blog</p>
              
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* <NavigationMenuItem>
          <Link href="/create-project" legacyBehavior passHref>
            <NavigationMenuLink className="{navigationMenuTriggerStyle()}">
              <p className={cn("ml-8", pathname === "/create-project" ? "animate-pulse text-lg text-blod" : " ")}>Add Project</p>
              
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem> */}

        </NavigationMenuList>
      </NavigationMenu>
      </div>
      
      <div>
        <MobileNav />
      </div>
      <div className="hidden md:block -ml-4">
      <UserButton afterSignOutUrl="/" />
      </div>
      <div className="hidden md:block">
        <ModeToggle />
      </div>
      
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"