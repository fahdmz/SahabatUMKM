
import { useEffect, useRef, useState } from "react";
import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";

// Below this confidence, or on any AI failure/timeout, we fall back to the
// deterministic regex parser rather than trust a shaky extraction.
const AI_CONFIDENCE_THRESHOLD = 0.5;

function CatatBelanja() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
    ];

    const [businessId, setBusinessId] = useState(null);

    const [rawText, setRawText] = useState("");
    const [parsedItems, setParsedItems] = useState(null);
    const [parseError, setParseError] = useState("");
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        async function loadBusinessId() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: businessData } = await supabase
                .from("businesses")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (businessData) setBusinessId(businessData.id);
        }

        loadBusinessId();
    }, []);

    // =========================
    // FALLBACK PARSER (deterministic, no AI)
    // =========================
    // This is the fallback path — used when the AI parser is unavailable,
    // times out, or returns low-confidence output. It only handles the
    // strict "Nama Barang Harga" shape; it is NOT what most users hit
    // first, so don't delete it during future AI work.

    function parseBelanjaTextFallback(text) {
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

    async function logAiParse({
        source = "expense_text",
        rawInput = rawText,
        rawResponse,
        confidence,
        items,
        usedFallback,
    }) {
        if (!businessId) return;

        const { error } = await supabase.from("ai_parse_log").insert({
            business_id: businessId,
            source,
            raw_input: rawInput,
            raw_ai_response: rawResponse ?? null,
            confidence: confidence ?? null,
            parsed_items: items,
            used_fallback: usedFallback,
        });

        if (error) {
            console.error("GAGAL LOG AI PARSE:", error);
        }
    }

    async function handlePeriksa() {
        setSaveMessage("");
        setParseError("");
        setChecking(true);

        // Try the AI parser first — it understands shorthand ("26rb", "2L
        // minyak") the regex fallback below can't. Rule: AI only extracts/
        // classifies here, it never computes a total or writes to the DB
        // directly — this still lands in the same preview-then-confirm flow.
        const { data, error: invokeError } = await supabase.functions.invoke(
            "parse-expense-text",
            { body: { text: rawText } }
        );

        const aiUsable =
            !invokeError &&
            data?.items &&
            data.confidence >= AI_CONFIDENCE_THRESHOLD;

        if (aiUsable) {
            setChecking(false);
            setParsedItems(data.items);
            logAiParse({
                rawResponse: data.rawResponse,
                confidence: data.confidence,
                items: data.items,
                usedFallback: false,
            });
            return;
        }

        // AI unavailable, timed out, or unsure — fall back to the
        // deterministic parser so recording never just breaks.
        const { items, error } = parseBelanjaTextFallback(rawText);

        setChecking(false);

        if (error) {
            setParseError(error);
            setParsedItems(null);
            return;
        }

        setParsedItems(items);
        logAiParse({
            rawResponse: data?.rawResponse ?? { invokeError: invokeError?.message },
            confidence: data?.confidence ?? null,
            items,
            usedFallback: true,
        });
    }

    // =========================
    // RECEIPT PHOTO (AI OCR — no deterministic fallback exists for a photo)
    // =========================

    function resizeImageToBase64(file, maxDimension = 1280) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                const scale = Math.min(
                    1,
                    maxDimension / Math.max(img.width, img.height)
                );

                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                URL.revokeObjectURL(objectUrl);

                resolve(dataUrl.replace(/^data:image\/jpeg;base64,/, ""));
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Gagal membaca file foto."));
            };

            img.src = objectUrl;
        });
    }

    async function handlePhotoSelected(e) {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) return;

        setPhotoError("");
        setSaveMessage("");
        setUploadingPhoto(true);

        try {
            const imageBase64 = await resizeImageToBase64(file);

            const { data, error: invokeError } = await supabase.functions.invoke(
                "parse-expense-receipt",
                { body: { imageBase64, mediaType: "image/jpeg" } }
            );

            const usable =
                !invokeError &&
                data?.items &&
                data.items.length > 0 &&
                data.confidence >= AI_CONFIDENCE_THRESHOLD;

            if (!usable) {
                setPhotoError(
                    "Gagal membaca struk ini. Coba ketik belanjaannya di kolom sebelah ya, Bu."
                );

                logAiParse({
                    source: "receipt_photo",
                    rawInput: "[foto struk]",
                    rawResponse:
                        data?.rawResponse ?? { invokeError: invokeError?.message },
                    confidence: data?.confidence ?? null,
                    items: [],
                    usedFallback: false,
                });

                return;
            }

            setParsedItems(data.items);
            setRawText("");
            logAiParse({
                source: "receipt_photo",
                rawInput: "[foto struk]",
                rawResponse: data.rawResponse,
                confidence: data.confidence,
                items: data.items,
                usedFallback: false,
            });
        } catch (error) {
            console.error("PHOTO PARSE CRASHED:", error);
            setPhotoError("Terjadi kesalahan saat membaca foto.");
        } finally {
            setUploadingPhoto(false);
        }
    }

    // =========================
    // SAVE TO SUPABASE
    // =========================

    async function handleSimpan() {
        if (!parsedItems || parsedItems.length === 0) return;

        setSaving(true);
        setSaveMessage("");

        try {
            if (!businessId) {
                setSaveMessage("Gagal mengambil data bisnis.");
                setSaving(false);
                return;
            }

            const rows = parsedItems.map((item) => ({
                business_id: businessId,
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

                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={fileInputRef}
                                onChange={handlePhotoSelected}
                                className="hidden"
                            />

                            <div className="mt-8">
                                <Button
                                    bgColor="white"
                                    children={
                                        uploadingPhoto
                                            ? "Membaca Struk..."
                                            : "Ambil Foto"
                                    }
                                    font="font-bold"
                                    textColor="text-red-800"
                                    onClick={
                                        uploadingPhoto
                                            ? undefined
                                            : () => fileInputRef.current?.click()
                                    }
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {photoError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="mt-4 text-sm font-bold text-red-600"
                                    >
                                        {photoError}
                                    </motion.p>
                                )}
                            </AnimatePresence>
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
                                                children={
                                                    checking
                                                        ? "Memeriksa..."
                                                        : "Periksa Dulu"
                                                }
                                                font="font-bold"
                                                onClick={
                                                    checking
                                                        ? undefined
                                                        : handlePeriksa
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

