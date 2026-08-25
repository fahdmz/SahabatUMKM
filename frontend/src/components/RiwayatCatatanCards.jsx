
import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { supabase } from "../lib/supabase";
import RiwayatCatatanCard from "./RiwayatCatatanCard";

function RiwayatCatatanCards() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        async function getTransactions() {
            setLoading(true);
            setErrorMessage("");

            try {
                // =========================
                // GET CURRENT USER
                // =========================

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    setErrorMessage("Belum login.");
                    return;
                }

                // =========================
                // GET BUSINESS
                // =========================

                const {
                    data: businessData,
                    error: businessError,
                } = await supabase
                    .from("businesses")
                    .select("id")
                    .eq("owner_id", user.id)
                    .limit(1);

                if (
                    businessError ||
                    !businessData ||
                    businessData.length === 0
                ) {
                    console.error(
                        "GAGAL MENGAMBIL BUSINESS:",
                        businessError
                    );

                    setErrorMessage(
                        "Belum menemukan bisnis untuk akun ini."
                    );

                    return;
                }

                const businessId = businessData[0].id;

                // =========================
                // GET SALES + EXPENSES
                // =========================

                const [
                    { data: salesData, error: salesError },
                    { data: expensesData, error: expensesError },
                ] = await Promise.all([
                    supabase
                        .from("sales")
                        .select(`
id,
    quantity,
    total_price,
    sold_at,
    menu_id,
    menus(
        id,
        name
    )
        `)
                        .eq("business_id", businessId)
                        .is("deleted_at", null),

                    supabase
                        .from("expenses")
                        .select(`
id,
    description,
    amount,
    spent_at
        `)
                        .eq("business_id", businessId)
                        .is("deleted_at", null),
                ]);

                if (salesError) {
                    console.error(
                        "GAGAL MENGAMBIL SALES:",
                        salesError
                    );

                    setErrorMessage(
                        "Gagal mengambil riwayat penjualan."
                    );

                    return;
                }

                if (expensesError) {
                    console.error(
                        "GAGAL MENGAMBIL EXPENSES:",
                        expensesError
                    );

                    setErrorMessage(
                        "Gagal mengambil riwayat belanja."
                    );

                    return;
                }

                // =========================
                // NORMALIZE SALES
                // =========================

                const sales = (salesData || []).map((sale) => ({
                    id: `sale - ${sale.id} `,
                    originalId: sale.id,

                    namaMenu:
                        sale.menus?.name || "Penjualan",

                    time: formatTime(sale.sold_at),
                    tanggal: formatDate(sale.sold_at),

                    Uang: Number(sale.total_price) || 0,

                    type: "income",

                    originalType: "sale",

                    rawData: sale,
                }));

                // =========================
                // NORMALIZE EXPENSES
                // =========================

                const expenses = (expensesData || []).map((expense) => ({
                    id: `expense - ${expense.id} `,
                    originalId: expense.id,

                    namaMenu:
                        expense.description || "Belanja",

                    time: formatTime(expense.spent_at),
                    tanggal: formatDate(expense.spent_at),

                    Uang: Number(expense.amount) || 0,

                    type: "expense",

                    originalType: "expense",

                    rawData: expense,
                }));

                // =========================
                // COMBINE + SORT
                // =========================

                const combined = [
                    ...sales,
                    ...expenses,
                ].sort((a, b) => {
                    const dateA = getTransactionDate(a);
                    const dateB = getTransactionDate(b);

                    return dateB - dateA;
                });

                console.log("=== RIWAYAT TRANSACTIONS ===");
                console.log(combined);

                setTransactions(combined);
            } catch (error) {
                console.error(
                    "RIWAYAT QUERY CRASHED:",
                    error
                );

                setErrorMessage(
                    "Terjadi kesalahan saat mengambil riwayat."
                );
            } finally {
                setLoading(false);
            }
        }

        getTransactions();
    }, []);

    // =========================
    // EDIT / DELETE HANDLERS
    // =========================

    function handleEdit(transaction) {
        setEditingId(transaction.id);
    }

    function handleCancelEdit() {
        setEditingId(null);
    }

    async function handleSaveEdit(transaction, { description, amount }) {
        const table = transaction.originalType === "sale" ? "sales" : "expenses";

        const updates =
            transaction.originalType === "sale"
                ? { total_price: amount }
                : { description, amount };

        const { error } = await supabase
            .from(table)
            .update(updates)
            .eq("id", transaction.originalId);

        if (error) {
            console.error("GAGAL UPDATE TRANSAKSI:", error);
            alert("Gagal menyimpan perubahan.");
            return;
        }

        setTransactions((current) =>
            current.map((item) =>
                item.id === transaction.id
                    ? {
                        ...item,
                        namaMenu:
                            transaction.originalType === "sale"
                                ? item.namaMenu
                                : description,
                        Uang: amount,
                    }
                    : item
            )
        );

        setEditingId(null);
    }

    async function handleDelete(transaction) {
        const confirmed = window.confirm(
            `Hapus catatan "${transaction.namaMenu}"? Catatan ini tidak akan muncul lagi di riwayat.`
        );

        if (!confirmed) return;

        const table = transaction.originalType === "sale" ? "sales" : "expenses";

        const { error } = await supabase
            .from(table)
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", transaction.originalId);

        if (error) {
            console.error("GAGAL HAPUS TRANSAKSI:", error);
            alert("Gagal menghapus catatan.");
            return;
        }

        setTransactions((current) =>
            current.filter((item) => item.id !== transaction.id)
        );
    }

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map((item) => (
                    <motion.div
                        key={item}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            delay: item * 0.1,
                        }}
                        className="h-28 animate-pulse rounded-2xl bg-white shadow-lg"
                    />
                ))}
            </div>
        );
    }

    // =========================
    // ERROR
    // =========================

    if (errorMessage) {
        return (
            <div className="rounded-2xl bg-red-50 p-6 text-center font-bold text-red-700">
                {errorMessage}
            </div>
        );
    }

    // =========================
    // EMPTY
    // =========================

    if (transactions.length === 0) {
        return (
            <motion.div
                initial={{
                    opacity: 0,
                    y: 10,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                className="rounded-2xl bg-white p-10 text-center shadow-lg"
            >
                <h2 className="text-xl font-extrabold">
                    Belum ada catatan
                </h2>

                <p className="mt-2 font-bold text-gray-400">
                    Catatan penjualan dan belanja Ibu akan muncul di sini.
                </p>
            </motion.div>
        );
    }

    // =========================
    // DISPLAY
    // =========================

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 20,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.5,
                ease: "easeOut",
            }}
            className="flex max-h-[500px] flex-col gap-4 overflow-y-auto pr-2"
        >
            {transactions.map((item) => (
                <RiwayatCatatanCard
                    key={item.id}
                    namaMenu={item.namaMenu}
                    time={item.time}
                    tanggal={item.tanggal}
                    Uang={item.Uang}
                    type={item.type}
                    isExpense={item.originalType === "expense"}
                    isEditing={editingId === item.id}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item)}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={(values) => handleSaveEdit(item, values)}
                />
            ))}
        </motion.div>
    );
}

// =========================
// DATE HELPERS
// =========================

function formatTime(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
        return "Hari Ini";
    }

    if (isSameDay(date, yesterday)) {
        return "Kemarin";
    }

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function isSameDay(dateA, dateB) {
    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
}

function getTransactionDate(transaction) {
    return new Date(
        transaction.originalType === "sale"
            ? transaction.rawData.sold_at
            : transaction.rawData.spent_at
    );
}

export default RiwayatCatatanCards;

