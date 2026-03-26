import Navbar from "@/components/_home/navbar";
import { syncUser } from "@/lib/auth/sync-user";


const AuthLayout = async ({
  children
}: {
  children: React.ReactNode
}) => {

  const dbUser = await syncUser();
  return ( 
    <div className="min-h-full">
      <Navbar
        isAdmin={dbUser?.role === "ADMIN"}
        userId={dbUser?.clerkId ?? null}
      />
      {children}
    </div>
   );
}
 
export default AuthLayout;