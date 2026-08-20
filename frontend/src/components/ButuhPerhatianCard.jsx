
import { motion } from "motion/react";

function ButuhPerhatianCard({ namaMenu, stok, minStok }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-white p-6 shadow-xl"
        >
            <h3 className="text-2xl font-bold text-black">
                {namaMenu}
            </h3>

            <div className="mt-5 flex items-end justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-400">
                        STOK TERSISA
                    </p>

                    <p className="mt-1 text-3xl font-extrabold text-black">
                        {stok}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-sm font-bold text-gray-400">
                        MINIMUM STOK
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-700">
                        {minStok}
                    </p>
                </div>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-600">
                    Stok menu ini perlu diperhatikan.
                </p>
            </div>
        </motion.div>
    );
}

export default ButuhPerhatianCard;

