import { motion } from "motion/react";

function NotificationCard({
    title = "Data Berhasil Disimpan!",
    message = "Data sudah berhasil disimpan.",
    highlight,
    type = "success",
    onClose
}) {
    const isSuccess = type === "success";


    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 20,
                scale: 0.95
            }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1
            }}
            exit={{
                opacity: 0,
                y: 20,
                scale: 0.95
            }}
            transition={{
                duration: 0.25,
                ease: "easeOut"
            }}
            className="fixed left-1/2 top-20 z-50 w-[450px] -translate-x-1/2"
        >
            <div className="rounded-3xl bg-white px-10 py-10 text-center shadow-2xl">

                {/* ICON */}
                <div
                    className={`
                    mx-auto flex h-16 w-16 items-center justify-center
                    rounded-full
                    ${isSuccess
                            ? "bg-green-600"
                            : "bg-red-500"
                        }
                `}
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white">
                        <span className="text-xl font-extrabold text-white">
                            {isSuccess ? "✓" : "!"}
                        </span>
                    </div>
                </div>

                {/* TITLE */}
                <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
                    {title}
                </h2>

                {/* MESSAGE */}
                <p className="mt-2 text-sm font-semibold text-gray-400">
                    {message}{" "}
                    {highlight && (
                        <span className="font-extrabold text-green-500">
                            {highlight}
                        </span>
                    )}
                </p>

                {/* CLOSE */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="mt-6 text-sm font-bold text-gray-400 transition hover:text-gray-600"
                    >
                        Tutup
                    </button>
                )}

            </div>
        </motion.div>
    );


}

export default NotificationCard;
