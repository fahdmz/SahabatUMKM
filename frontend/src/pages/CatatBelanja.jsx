
import { useState } from "react";
import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";

function CatatBelanja() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
    ];

    const [rawText, setRawText] = useState("");
    const [parsedItems, setParsedItems] = useState(null);
    const [parseError, setParseError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // =========================
    // PARSE FREE TEXT
    // =========================

    function parseBelanjaText(text) {
        const chunks = text
            .split(",")
            .map((chunk) => chunk.trim())
            .filter((chunk) => chunk.length > 0);

        const items = [];

        for (const chunk of chunks) {
            const match = chunk.match(/^(.+?)\s+([\d.,]+)$/);

            if (!match) {
                return {
                    items: null,
                    error: `Tidak bisa baca: "${chunk}". Coba format "Nama Barang Harga", contoh "Minyak 28000".`,
                };
            }

            const description = match[1].trim();
            const amountDigits = match[2].replace(/[.,]/g, "");
            const amount = parseInt(amountDigits, 10);

            if (!description || isNaN(amount) || amount <= 0) {
                return {
                    items: null,
                    error: `Tidak bisa baca: "${chunk}". Coba format "Nama Barang Harga", contoh "Minyak 28000".`,
                };
            }

            items.push({
                description,
                amount,
            });
        }

        if (items.length === 0) {
            return {
                items: null,
                error: "Belum ada belanjaan yang diketik.",
            };
        }

        return {
            items,
            error: null,
        };
    }

    function handlePeriksa() {
        setSaveMessage("");

        const { items, error } = parseBelanjaText(rawText);

        if (error) {
            setParseError(error);
            setParsedItems(null);
            return;
        }

        setParseError("");
        setParsedItems(items);
    }

    // =========================
    // SAVE TO SUPABASE
    // =========================

    async function handleSimpan() {
        if (!parsedItems || parsedItems.length === 0) return;

        setSaving(true);
        setSaveMessage("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (!user) {
                setSaveMessage("Belum login.");
                setSaving(false);
                return;
            }

            const {
                data: businessData,
                error: businessError,
            } = await supabase
                .from("businesses")
                .select("*")
                .eq("owner_id", user.id);

            if (
                businessError ||
                !businessData ||
                businessData.length === 0
            ) {
                console.error(
                    "GAGAL MENGAMBIL BUSINESS:",
                    businessError
                );

                setSaveMessage("Gagal mengambil data bisnis.");
                setSaving(false);
                return;
            }

            const currentBusiness = businessData[0];

            const rows = parsedItems.map((item) => ({
                business_id: currentBusiness.id,
                description: item.description,
                amount: item.amount,
                spent_at: new Date().toISOString(),
            }));

            const { error: insertError } = await supabase
                .from("expenses")
                .insert(rows);

            if (insertError) {
                console.error(
                    "GAGAL SIMPAN EXPENSES:",
                    insertError
                );

                setSaveMessage("Gagal menyimpan belanja.");
                setSaving(false);
                return;
            }

            setSaveMessage("Belanja berhasil dicatat!");
            setRawText("");
            setParsedItems(null);
        } catch (error) {
            console.error("SAVE CRASHED:", error);
            setSaveMessage("Terjadi kesalahan.");
        }

        setSaving(false);
    }

    // =========================
    // ANIMATION VARIANTS
    // =========================

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.12,
            },
        },
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 25,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.55,
                ease: "easeOut",
            },
        },
    };

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            {/* NAVBAR */}
            <NavBar items={navItems} />

            {/* PAGE */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12"
            >
                <motion.div
                    variants={itemVariants}
                    className="flex w-[95%] max-w-300 flex-col overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12 lg:p-15"
                >
                    {/* TITLE */}
                    <motion.div variants={itemVariants}>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Catat Belanja
                        </h1>

                        <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-gray-300">
                            Biar catatan warung tetap rapi
                        </p>
                    </motion.div>

                    {/* INSTRUCTION */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{
                            y: -2,
                            scale: 1.005,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 250,
                        }}
                        className="mt-10 rounded-3xl border border-red-200 bg-red-100 p-6 md:mr-40"
                    >
                        <p className="text-xl font-bold leading-relaxed text-red-800 md:text-2xl">
                            Belanja apa aja hari ini, Bu?
                            Ketik aja kayak di WhatsApp:
                            <span className="ml-1">
                                "Minyak 28000, Ayam 150000"
                            </span>
                        </p>
                    </motion.div>

                    {/* SUBTITLE */}
                    <motion.p
                        variants={itemVariants}
                        className="mt-6 text-xs font-extrabold tracking-[0.2em] text-gray-300"
                    >
                        ASISTEN BAKAL BANTU RAPIHIN CATATANNYA
                    </motion.p>

                    {/* INPUT AREA */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-4 flex flex-col gap-5 md:flex-row"
                    >
                        {/* PHOTO */}
                        <motion.div
                            whileHover={{
                                y: -4,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 250,
                                damping: 20,
                            }}
                            className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-100 p-10 text-center"
                        >
                            <h2 className="text-2xl font-extrabold">
                                Malas Ngetik?
                            </h2>

                            <h2 className="text-2xl font-extrabold">
                                Foto Nota Saja!
                            </h2>

                            <p className="mt-2 text-gray-400">
                                Nanti AI akan bacain nominal buat ibu.
                            </p>

                            <div className="mt-8">
                                <Button
                                    bgColor="white"
                                    children="Ambil Foto"
                                    font="font-bold"
                                    textColor="text-red-800"
                                />
                            </div>
                        </motion.div>

                        {/* TEXT INPUT */}
                        <motion.div
                            className="flex flex-1 flex-col"
                            variants={itemVariants}
                        >
                            <motion.textarea
                                whileFocus={{
                                    scale: 1.01,
                                }}
                                transition={{
                                    duration: 0.2,
                                }}
                                className="min-h-[300px] flex-1 resize-none rounded-[32px] border border-red-100 bg-white p-6 font-bold text-gray-700 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-red-200"
                                placeholder="Ketik belanjaan di sini..."
                                value={rawText}
                                onChange={(e) => {
                                    setRawText(e.target.value);
                                    setParsedItems(null);
                                    setParseError("");
                                    setSaveMessage("");
                                }}
                            />

                            {/* ERROR */}
                            <AnimatePresence mode="wait">
                                {parseError && (
                                    <motion.p
                                        initial={{
                                            opacity: 0,
                                            y: -5,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -5,
                                        }}
                                        className="mt-2 text-sm font-bold text-red-600"
                                    >
                                        {parseError}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* PARSED RESULT */}
                            <AnimatePresence>
                                {parsedItems && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            height: 0,
                                            y: -10,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            height: 0,
                                            y: -10,
                                        }}
                                        transition={{
                                            duration: 0.3,
                                        }}
                                        className="mt-3 overflow-hidden rounded-2xl bg-gray-50 p-4"
                                    >
                                        <p className="text-sm font-bold text-gray-500">
                                            Ini yang ke-baca, cek dulu ya Bu:
                                        </p>

                                        <div className="mt-2 flex flex-col gap-1">
                                            {parsedItems.map(
                                                (item, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{
                                                            opacity: 0,
                                                            x: -10,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            x: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                index *
                                                                0.05,
                                                        }}
                                                        className="flex justify-between text-gray-700"
                                                    >
                                                        <span>
                                                            {
                                                                item.description
                                                            }
                                                        </span>

                                                        <span className="font-bold">
                                                            Rp
                                                            {item.amount.toLocaleString(
                                                                "id-ID"
                                                            )}
                                                        </span>
                                                    </motion.div>
                                                )
                                            )}
                                        </div>

                                        <div className="mt-3 flex justify-between border-t border-gray-200 pt-2 font-extrabold text-gray-800">
                                            <span>Total</span>

                                            <span>
                                                Rp
                                                {parsedItems
                                                    .reduce(
                                                        (sum, item) =>
                                                            sum +
                                                            item.amount,
                                                        0
                                                    )
                                                    .toLocaleString(
                                                        "id-ID"
                                                    )}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* SAVE MESSAGE */}
                            <AnimatePresence mode="wait">
                                {saveMessage && (
                                    <motion.p
                                        initial={{
                                            opacity: 0,
                                            y: -5,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -5,
                                        }}
                                        className="mt-2 text-sm font-bold text-green-700"
                                    >
                                        {saveMessage}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* BUTTON */}
                            <div className="mt-3">
                                <AnimatePresence mode="wait">
                                    {!parsedItems ? (
                                        <motion.div
                                            key="check"
                                            initial={{
                                                opacity: 0,
                                                x: -10,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                x: 10,
                                            }}
                                        >
                                            <Button
                                                bgColor="bg-red-900"
                                                children="Periksa Dulu"
                                                font="font-bold"
                                                onClick={
                                                    handlePeriksa
                                                }
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="save"
                                            initial={{
                                                opacity: 0,
                                                x: 10,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                x: -10,
                                            }}
                                        >
                                            <Button
                                                bgColor="bg-red-900"
                                                children={
                                                    saving
                                                        ? "Menyimpan..."
                                                        : "Simpan Belanja"
                                                }
                                                font="font-bold"
                                                onClick={
                                                    handleSimpan
                                                }
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default CatatBelanja;

