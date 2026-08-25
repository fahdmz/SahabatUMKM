
import { motion } from "motion/react";

function RiwayatCatatanCard({
    namaMenu,
    time,
    tanggal,
    Uang,
    type,
    onEdit,
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            whileHover={{
                y: -3,
                scale: 1.01,
            }}
            transition={{
                duration: 0.35,
                ease: "easeOut",
            }}
            className="rounded-2xl bg-white px-8 py-6 shadow-lg"
        >
            <div className="flex items-center justify-between gap-6">

                {/* LEFT SIDE */}
                <div>
                    <h1 className="text-xl font-extrabold">
                        {namaMenu}
                    </h1>

                    <p className="mt-2 font-bold text-gray-300">
                        {time} · {tanggal}
                    </p>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex flex-col items-end gap-3">

                    {/* MONEY */}
                    <p className="whitespace-nowrap text-2xl font-extrabold">
                        Rp{Uang}
                    </p>

                    {/* EDIT BUTTON */}
                    <motion.button
                        type="button"
                        onClick={onEdit}
                        whileHover={{
                            scale: 1.05,
                        }}
                        whileTap={{
                            scale: 0.95,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                        }}
                        className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-bold text-gray-500 transition-colors hover:border-black hover:text-black"
                    >
                        Edit
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

export default RiwayatCatatanCard;

