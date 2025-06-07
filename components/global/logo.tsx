import { motion } from 'framer-motion';
import { Code } from 'lucide-react';


// Enhanced Logo Component
const Logo = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-3"
    >
      <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
        <Code className="w-5 h-5 text-white" />
      </div>
      <div className="hidden sm:block">
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
          iPaha
        </h1>
        <p className="text-xs text-gray-600 -mt-1">Full-Stack Developer</p>
      </div>
    </motion.div>
  );
};

export default Logo;