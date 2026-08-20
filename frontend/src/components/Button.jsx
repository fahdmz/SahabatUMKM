import React from "react";
import { motion } from "motion/react";

function Button({
    children,
    bgColor = "bg-blue-600",
    borderColor = "",
    textColor = "text-white",
    border = true,
    font = "",
    onClick,
}) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{
                scale: 1.02,
            }}
            whileTap={{
                scale: 0.97,
            }}
            transition={{
                duration: 0.1,
                ease: "easeOut",
            }}
            className={`
        px-6
        py-3
        rounded-lg
        transition
        ${font}
        ${bgColor}
        ${textColor}
        ${border ? `border ${borderColor}` : "border-none"}
    `}
        >
            {children}
        </motion.button>
    );
}

export default Button;