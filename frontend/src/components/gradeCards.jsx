import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import GradeCard from "./gradeCard";

function GradeCards({ grades }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!grades || grades.length === 0) {
        return null;
    }

    const current = grades[currentIndex];

    function nextCard() {
        setCurrentIndex(
            (currentIndex + 1) % grades.length
        );
    }

    function previousCard() {
        setCurrentIndex(
            (currentIndex - 1 + grades.length) %
            grades.length
        );
    }

    return (
        <div className="w-full max-w-5xl">

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{
                        opacity: 0,
                        x: 30,
                    }}
                    animate={{
                        opacity: 1,
                        x: 0,
                    }}
                    exit={{
                        opacity: 0,
                        x: -30,
                    }}
                    transition={{
                        duration: 0.25,
                        ease: "easeOut",
                    }}
                >
                    <GradeCard
                        title={current.title}
                        grade={current.grade}
                        description={current.description}
                    />
                </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between px-4 pt-4">

                <button
                    onClick={previousCard}
                    className="rounded-lg px-4 py-2 text-black transition hover:bg-gray-100"
                >
                    ←
                </button>

                <div className="text-sm font-bold text-gray-400">
                    {currentIndex + 1} / {grades.length}
                </div>

                <button
                    onClick={nextCard}
                    className="rounded-lg px-4 py-2 text-black transition hover:bg-gray-100"
                >
                    →
                </button>

            </div>
        </div>
    );
}

export default GradeCards;