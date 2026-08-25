import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ButuhPerhatianCard from "./ButuhPerhatianCard";

function ButuhPerhatianCards({ lowStockItems = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    function nextCard() {
        setCurrentIndex((prev) =>
            (prev + 1) % lowStockItems.length
        );
    }

    function previousCard() {
        setCurrentIndex((prev) =>
            (prev - 1 + lowStockItems.length) %
            lowStockItems.length
        );
    }

    // =========================
    // EMPTY STATE
    // =========================

    if (lowStockItems.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                    mt-5
                    flex
                    min-h-32
                    items-center
                    justify-center
                    rounded-3xl
                    border
                    border-dashed
                    border-gray-300
                    bg-white/40
                    px-6
                "
            >
                <p className="
                    text-center
                    text-sm
                    font-bold
                    italic
                    text-gray-300
                ">
                    Semua menu ibu laku keras di Bulan Ini!
                </p>
            </motion.div>
        );
    }

    const current = lowStockItems[currentIndex];

    return (
        <div className="mt-5 w-full">

            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{
                        opacity: 0,
                        x: 20,
                    }}
                    animate={{
                        opacity: 1,
                        x: 0,
                    }}
                    exit={{
                        opacity: 0,
                        x: -20,
                    }}
                    transition={{
                        duration: 0.25,
                    }}
                >
                    <ButuhPerhatianCard
                        namaMenu={current.menus?.name}
                        stok={current.stock}
                        minStok={current.minimum_stock}
                    />
                </motion.div>
            </AnimatePresence>

            {lowStockItems.length > 1 && (
                <div className="mt-3 flex items-center justify-between">

                    <button
                        onClick={previousCard}
                        className="
                            rounded-full
                            px-3
                            py-1
                            text-sm
                            font-bold
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-700
                        "
                    >
                        ←
                    </button>

                    <p className="text-xs font-bold text-gray-400">
                        {currentIndex + 1} / {lowStockItems.length}
                    </p>

                    <button
                        onClick={nextCard}
                        className="
                            rounded-full
                            px-3
                            py-1
                            text-sm
                            font-bold
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-700
                        "
                    >
                        →
                    </button>

                </div>
            )}
        </div>
    );
}

export default ButuhPerhatianCards;