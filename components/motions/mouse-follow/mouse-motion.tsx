import { useRef } from "react";
import { motion } from "framer-motion";
import { useFollowPointer } from "../use-follow-pointer";

export default function MouseFollowApp() {
  const ref = useRef(null);
  const { x, y } = useFollowPointer(ref);

  return (
    <motion.div
      ref={ref}
      className="box"
      animate={{ x, y }}
      transition={{
        type: "spring",
        damping: 3,
        stiffness: 50,
        restDelta: 0.001
      }}
    />
  );
}
