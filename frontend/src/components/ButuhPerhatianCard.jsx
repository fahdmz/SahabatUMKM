import { motion } from "motion/react";

function ButuhPerhatianCard({
    namaMenu,
    stok,
    minStok,
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="
                rounded-3xl
                border
                border-gray-200
                bg-white
                p-6
                shadow-sm
            "
        >

            {/* HEADER */}

            <div className="flex items-start gap-4">

                <div className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-orange-100
                    text-lg
                ">
                    !
                </div>

                <div>
                    <p className="
                        text-xs
                        font-extrabold
                        tracking-widest
                        text-orange-500
                    ">
                        BUTUH PERHATIAN
                    </p>

                    <h3 className="
                        mt-2
                        text-xl
                        font-extrabold
                        text-gray-900
                    ">
                        Stok {namaMenu} menipis
                    </h3>
                </div>

            </div>


            {/* STOCK INFO */}

            <div className="
                mt-6
                rounded-2xl
                bg-gray-50
                p-4
            ">

                <div className="flex items-center justify-between">

                    <div>
                        <p className="
                            text-xs
                            font-bold
                            text-gray-400
                        ">
                            STOK SEKARANG
                        </p>

                        <p className="
                            mt-1
                            text-2xl
                            font-extrabold
                            text-red-500
                        ">
                            {stok}
                        </p>
                    </div>

                    <div className="text-right">

                        <p className="
                            text-xs
                            font-bold
                            text-gray-400
                        ">
                            MINIMUM
                        </p>

                        <p className="
                            mt-1
                            text-xl
                            font-extrabold
                            text-gray-700
                        ">
                            {minStok}
                        </p>

                    </div>

                </div>

            </div>


            {/* MESSAGE */}

            <p className="
                mt-4
                text-sm
                font-semibold
                leading-5
                text-gray-500
            ">
                Stok menu ini sudah menyentuh batas minimum.
                Coba tambah stok sebelum kehabisan.
            </p>

        </motion.div>
    );
}

export default ButuhPerhatianCard;