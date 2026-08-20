import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

function SaranMenuCards({ recommendations }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [recommendations]);

    const current = recommendations[currentIndex];

    function nextCard() {
        setCurrentIndex(
            (currentIndex + 1) % recommendations.length
        );
    }

    function previousCard() {
        setCurrentIndex(
            (currentIndex - 1 + recommendations.length) %
            recommendations.length
        );
    }

    if (recommendations.length === 0) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="flex justify-center items-center p-40 bg-gray-50 rounded-xl border border-gray-300 border-dashed">

                    <h1 className="text-2xl font-extrabold">Gak ada apa apa lagi</h1>
                </motion.div>
            </>
        )
    }
    return (
        <div className="w-full max-w-xl">
            {/* Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl bg-white p-8 shadow-xl"
                >
                    <div className="text-3xl font-bold text-black">
                        {current.NamaMenu}
                    </div>

                    <div className="pt-4 text-lg text-gray-600">
                        {current.Deskripsi}
                    </div>

                    <div className="pt-6 text-lg font-semibold text-gray-800">
                        Kenapa?
                    </div>

                    <div className="pt-2 text-gray-600">
                        {current.Alasan}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={previousCard}
                    className="rounded-lg px-4 py-2 text-black hover:bg-gray-100"
                >
                    ←
                </button>

                <div className="text-sm text-gray-400">
                    {currentIndex + 1} / {recommendations.length}
                </div>

                <button
                    onClick={nextCard}
                    className="rounded-lg px-4 py-2 text-black hover:bg-gray-100"
                >
                    →
                </button>
            </div>
        </div>
    );
}

export default SaranMenuCards;