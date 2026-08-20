
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ButuhPerhatianCard from "./ButuhPerhatianCard";

function ButuhPerhatianCards({ lowStockItems = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    function nextCard() {
        setCurrentIndex(
            (currentIndex + 1) % lowStockItems.length
        );
    }

    function previousCard() {
        setCurrentIndex(
            (currentIndex - 1 + lowStockItems.length) %
            lowStockItems.length
        );
    }

    // Tidak ada stok yang perlu diperhatikan
    if (lowStockItems.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-50 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8"
            >
                <div className="text-center">
                    <h3 className="text-xl font-extrabold text-gray-700">
                        Semua stok aman
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-gray-400">
                        Belum ada menu yang perlu diperhatikan.
                    </p>
                </div>
            </motion.div>
        );
    }

    const current = lowStockItems[currentIndex];

    return (
        <div className="w-full max-w-xl">

            {/* CARD */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                >
                    <ButuhPerhatianCard
                        namaMenu={current.menus.name}
                        stok={current.stock}
                        minStok={current.minimum_stock}
                    />
                </motion.div>
            </AnimatePresence>

            {/* NAVIGATION */}
            {lowStockItems.length > 1 && (
                <div className="flex items-center justify-between pt-4">

                    <button
                        onClick={previousCard}
                        className="rounded-lg px-4 py-2 text-black transition hover:bg-gray-100"
                    >
                        ←
                    </button>

                    <div className="text-sm font-semibold text-gray-400">
                        {currentIndex + 1} / {lowStockItems.length}
                    </div>

                    <button
                        onClick={nextCard}
                        className="rounded-lg px-4 py-2 text-black transition hover:bg-gray-100"
                    >
                        →
                    </button>

                </div>
            )}
        </div>
    );
}

export default ButuhPerhatianCards;

