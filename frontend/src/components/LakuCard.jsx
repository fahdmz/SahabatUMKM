import { motion } from "motion/react";

function LakuCard({ NamaMenu, Porsi, Pemasukan, rank }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{
                y: -3,
                scale: 1.01,
            }}
            transition={{
                duration: 0.3,
                ease: "easeOut",
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-lg transition-shadow hover:shadow-xl"
        >
            {/* LEFT SIDE */}
            <div className="flex items-center gap-5">

                {/* Ranking */}
                {rank && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-extrabold text-green-700">
                        #{rank}
                    </div>
                )}

                {/* Menu Name */}
                <div>
                    <div className="text-xl font-bold text-gray-900">
                        {NamaMenu}
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                        Menu terlaris
                    </div>
                </div>

            </div>


            {/* RIGHT SIDE */}
            <div className="text-right">

                <div className="text-2xl font-extrabold text-gray-900">
                    {Porsi}
                </div>

                <div className="text-sm text-gray-500">
                    Porsi Terjual
                </div>

                <div className="mt-1 text-sm font-semibold text-green-700">
                    Rp{Pemasukan.toLocaleString("id-ID")}
                </div>

            </div>

        </motion.div>
    );
}

export default LakuCard;