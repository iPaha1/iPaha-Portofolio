import Image from "next/image";
import { motion } from "framer-motion";

const ProfilePhoto = () => {
    return ( 
        <motion.div whileHover={{scale: 7.5}} >
            <Image
                src="/images/photo.png"
                alt="Picture of the author"
                width={70}
                height={50}
                className="dark:hidden transition-transform transform hover:scale-110 rounded-md"
            />

            <Image
                src="/images/profilePic.jpeg"
                alt="Picture of the author"
                width={70}
                height={50}
                className="hidden dark:block transition-transform transform hover:scale-110 rounded-md"
            />
        </motion.div>
     );
}
 
export default ProfilePhoto;