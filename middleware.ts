import { authMiddleware } from "@clerk/nextjs";
 
// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
    publicRoutes: [
        "/",
        "/view-all-projects",
        "/view-all-projects/[id]",
        "/contact-me",
        "/blog",
        "/education-experience-skills",
        "/my-journey",
        "/pricing",
        "/view-all-services",
        "/privacy-policy",
        "/terms-and-conditions",
    ],
});
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
