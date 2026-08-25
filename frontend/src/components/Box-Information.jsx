import { motion } from "motion/react";

function BoxInformation({ title, description, totalHemat }) {
    return (
        <motion.div
            whileHover={{
                y: -5,
                scale: 1.01,
            }}
            transition={{
                type: "spring",
                stiffness: 250,
                damping: 20,
            }}
            className="flex h-full w-full flex-col rounded-[2rem] border border-red-700 bg-red-100 p-8 shadow-lg"
        >
            {/* TITLE */}
            <h1 className="text-2xl font-extrabold text-red-800">
                {title}
            </h1>

            {/* DESCRIPTION */}
            <p className="mt-6 text-2xl font-bold leading-relaxed text-amber-700">
                {description}
            </p>

            {/* SAVING */}
            <div className="mt-auto rounded-2xl bg-red-200 p-5">
                <p className="text-xl font-extrabold text-red-400">
                    Potensi Hemat: Rp{totalHemat}/bulan
                </p>
            </div>
        </motion.div>
    );
}

export default BoxInformation;