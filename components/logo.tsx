import Image from "next/image";

const Logo = () => {
    return ( 
        <div>
            <Image
                src="/images/logo-black.svg"
                alt="Picture of the author"
                width={70}
                height={50}
                className="dark:hidden transition-transform transform hover:scale-110"
            />

            <Image
                src="/images/logo-white.svg"
                alt="Picture of the author"
                width={70}
                height={50}
                className="hidden dark:block transition-transform transform hover:scale-110"
            />
        </div>
     );
}
 
export default Logo;