import exp from "constants";
import Image from "next/image";
import Link from "next/link";

const LogoFooter = () => {
    return (
        <div>
            <Link href="/" className="flex items-center space-x-2">
            <Image
                src="/images/home-logo-footer.png"
                alt="Picture of the author"
                width={100}
                height={100}
                className="dark:hidden transition-transform transform hover:scale-110 rounded-md"
            />
            </Link>
            <Link href="/" className="flex items-center space-x-2">
            <Image
                src="/images/home-logo-footer.png" 
                alt="Picture of the author"
                width={100}
                height={100}
                className="hidden dark:block transition-transform transform hover:scale-110 rounded-md"
            />
            </Link>
        </div>
    );

}   

export default LogoFooter;