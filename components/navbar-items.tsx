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


const components: { title: string; href: string; description: string }[] = [
  {
    title: "Admin Dashboard",
    href: "/docs/primitives/alert-dialog",
    description:
      "A complete multi functional admin dashboard which can be used for all types of web applications.",
  },
  {
    title: "Ecommerce Website",
    href: "/docs/primitives/hover-card",
    description:
      "Advance Ecommerce Website with Next.js and Stripe API for payment processing.",
  },
  {
    title: "Event Booking and Management Website",
    href: "/docs/primitives/progress",
    description:
      "Advance event booking and management website with Next.js and Stripe API for payment processing.",
  },
  {
    title: "Advance Blogging Website",
    href: "/docs/primitives/scroll-area",
    description: "Advance blogging website with notificaiton system and user authentication system.",
  },
  {
    title: "Advance AI SAAS Platforn",
    href: "/docs/primitives/tabs",
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

export function NavbarItems() {
  return (
    <div className="shadow-md h-16 sm:px-6 lg:px-8 relative flex justify-between items-center">
      <div className="flex gap-x-2">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Services</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] text-gray-700 hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      {/* <Icons.logo className="h-6 w-6" /> */}
                      <Logo />
                      <div className="mb-2 mt-4 text-lg font-medium">
                        View All Services
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Our services are designed to help you achieve your goals and objectives.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <ListItem href="/docs" title="Pricing">
                  Our prices are well structured and affordable.
                </ListItem>
                <ListItem href="/docs/installation" title="Our Offers">
                  View all our offers and services.
                </ListItem>
                <ListItem href="/docs/primitives/typography" title="Partner with Us">
                  Partner with us next level of innovation.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Projects</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] text-gray-700 hover:bg-gray-300 hover:rounded-lg hover:text-gray-900 duration-300 px-2 py-1">
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
            <Link href="/about-me" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                About Me
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/contact" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Contact
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      </div>
      <div>
        <MobileNav />
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
