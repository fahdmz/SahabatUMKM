
import { useState } from "react";
import { motion } from "motion/react";

function RiwayatCatatanCard({
    namaMenu,
    time,
    tanggal,
    Uang,
    type,
    isExpense,
    isEditing,
    onEdit,
    onDelete,
    onCancelEdit,
    onSaveEdit,
}) {
    const [editDescription, setEditDescription] = useState(namaMenu);
    const [editAmount, setEditAmount] = useState(String(Uang));

    if (isEditing) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-white px-8 py-6 shadow-lg ring-2 ring-green-200"
            >
                {isExpense && (
                    <div className="mb-3">
                        <label className="text-xs font-bold text-gray-400">
                            NAMA BELANJA
                        </label>
                        <input
                            className="mt-1 w-full rounded-xl bg-gray-50 p-3 font-bold text-gray-700 outline-none"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-gray-400">
                        JUMLAH (RP)
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-xl bg-gray-50 p-3 font-bold text-gray-700 outline-none"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                    />
                </div>

                <div className="mt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            onSaveEdit({
                                description: editDescription,
                                amount: Number(editAmount) || 0,
                            })
                        }
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                    >
                        Simpan
                    </button>

                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 transition hover:border-black hover:text-black"
                    >
                        Batal
                    </button>
                </div>
            </motion.div>
        );
    }

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

                    {/* ACTIONS */}
                    <div className="flex gap-2">
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

                        <motion.button
                            type="button"
                            onClick={onDelete}
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
                            className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-bold text-red-500 transition-colors hover:border-red-500 hover:bg-red-50"
                        >
                            Hapus
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default RiwayatCatatanCard;
