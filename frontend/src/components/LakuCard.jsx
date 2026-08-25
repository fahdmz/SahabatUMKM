import { motion } from "motion/react";

function LakuCard({
    NamaMenu,
    Porsi,
    Pemasukan,
    rank,
}) {
    return (
        <motion.div
            whileHover={{
                y: -2,
                scale: 1.01,
            }}
            transition={{
                duration: 0.2,
            }}
            className="relative overflow-hidden rounded-2xl bg-white px-5 py-4 shadow-sm"
        >

            <div className="flex items-center justify-between">

                {/* LEFT */}
                <div className="flex min-w-0 items-center gap-4">

                    {/* RANK */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-extrabold text-green-600">
                        {rank}
                    </div>

                    {/* MENU NAME */}
                    <p className="truncate text-sm font-extrabold text-gray-900">
                        {NamaMenu}
                    </p>

                </div>


                {/* RIGHT */}
                <div className="text-right">

                    <p className="text-base font-extrabold text-gray-900">
                        {Porsi} Porsi
                    </p>

                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-300">
                        Rp{Number(Pemasukan).toLocaleString("id-ID")} Masuk
                    </p>

                </div>

            </div>


            {/* GREEN PROGRESS LINE */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100">

                <div
                    className="h-full rounded-r-full bg-green-600"
                    style={{
                        width: `${Math.min(
                            Number(Porsi) * 7,
                            100
                        )}%`,
                    }}
                />

            </div>

        </motion.div>
    );
}

export default LakuCard;