import { motion } from "motion/react";
import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, Navigate } from "react-router-dom";

function Beranda() {
    const [business, setBusiness] = useState(null);
    const [menus, setMenus] = useState([]);
    const [totalMasuk, setTotalMasuk] = useState(0);
    const [totalBelanja, setTotalBelanja] = useState(0);
    const [growthPercent, setGrowthPercent] = useState(0);
    const [topMenuToday, setTopMenuToday] = useState(null);
    const [urgentLowStock, setUrgentLowStock] = useState(null);

    // AI narration of the numbers above — null until it arrives (or fails),
    // at which point the existing hand-written sentence below is used
    // instead. The dashboard never waits on this or shows nothing.
    const [aiNarrative, setAiNarrative] = useState(null);

    const [loading, setLoading] = useState(true);
    const [hasNoTransactions, setHasNoTransactions] = useState(false);

    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    useEffect(() => {
        async function getBusinessAndMenus() {
            setLoading(true);

            try {

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    console.error("GAGAL MENGAMBIL USER:", userError);
                    return;
                }

                if (!user) {
                    console.log("BELUM LOGIN");
                    return;
                }

                const {
                    data: businessData,
                    error: businessError,
                } = await supabase
                    .from("businesses")
                    .select("*")
                    .eq("owner_id", user.id);

                if (businessError) {
                    console.error(
                        "GAGAL MENGAMBIL BUSINESS:",
                        businessError
                    );
                    return;
                }

                if (!businessData || businessData.length === 0) {
                    console.log("USER BELUM MEMILIKI BUSINESS");
                    return;
                }

                const currentBusiness = businessData[0];

                setBusiness(currentBusiness);

                // =========================
                // DATE BOUNDARIES
                // =========================

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const tomorrowStart = new Date(todayStart);
                tomorrowStart.setDate(
                    tomorrowStart.getDate() + 1
                );

                const yesterdayStart = new Date(todayStart);
                yesterdayStart.setDate(
                    yesterdayStart.getDate() - 1
                );

                // =========================
                // CHECK TODAY'S TRANSACTIONS
                // =========================

                const [
                    {
                        count: salesCount,
                        error: salesCountError,
                    },
                    {
                        count: expensesCount,
                        error: expensesCountError,
                    },
                ] = await Promise.all([
                    supabase
                        .from("sales")
                        .select("id", {
                            count: "exact",
                            head: true,
                        })
                        .eq(
                            "business_id",
                            currentBusiness.id
                        )
                        .is("deleted_at", null)
                        .gte(
                            "sold_at",
                            todayStart.toISOString()
                        )
                        .lt(
                            "sold_at",
                            tomorrowStart.toISOString()
                        ),

                    supabase
                        .from("expenses")
                        .select("id", {
                            count: "exact",
                            head: true,
                        })
                        .eq(
                            "business_id",
                            currentBusiness.id
                        )
                        .is("deleted_at", null)
                        .gte(
                            "spent_at",
                            todayStart.toISOString()
                        )
                        .lt(
                            "spent_at",
                            tomorrowStart.toISOString()
                        ),
                ]);

                if (salesCountError) {
                    console.error(
                        "GAGAL CHECK SALES:",
                        salesCountError
                    );
                    return;
                }

                if (expensesCountError) {
                    console.error(
                        "GAGAL CHECK EXPENSES:",
                        expensesCountError
                    );
                    return;
                }

                console.log(
                    "SALES HARI INI:",
                    salesCount
                );

                console.log(
                    "EXPENSES HARI INI:",
                    expensesCount
                );

                // =========================
                // EMPTY TODAY STATE
                // =========================

                const noTransactionsToday =
                    (salesCount || 0) === 0 &&
                    (expensesCount || 0) === 0;

                if (noTransactionsToday) {
                    console.log(
                        "HARI INI BELUM ADA TRANSAKSI"
                    );

                    setHasNoTransactions(true);

                    return;
                }

                // =========================
                // GET MENUS
                // =========================

                const {
                    data: menuData,
                    error: menuError,
                } = await supabase
                    .from("menus")
                    .select("*")
                    .eq(
                        "business_id",
                        currentBusiness.id
                    )
                    .eq("is_active", true);

                if (menuError) {
                    console.error(
                        "GAGAL MENGAMBIL MENU:",
                        menuError
                    );
                } else {
                    setMenus(menuData || []);
                }

                // =========================
                // GET SALES
                // TODAY + YESTERDAY
                // =========================

                const {
                    data: salesData,
                    error: salesError,
                } = await supabase
                    .from("sales")
                    .select(`
                        quantity,
                        total_price,
                        menu_id,
                        sold_at,
                        menus (
                            id,
                            name
                        )
                    `)
                    .eq(
                        "business_id",
                        currentBusiness.id
                    )
                    .is("deleted_at", null)
                    .gte(
                        "sold_at",
                        yesterdayStart.toISOString()
                    )
                    .lt(
                        "sold_at",
                        tomorrowStart.toISOString()
                    );

                if (salesError) {
                    console.error(
                        "GAGAL MENGAMBIL SALES:",
                        salesError
                    );
                    return;
                }

                // =========================
                // SPLIT TODAY / YESTERDAY
                // =========================

                const todaySales = (
                    salesData || []
                ).filter(
                    (sale) =>
                        new Date(sale.sold_at) >=
                        todayStart
                );

                const yesterdaySales = (
                    salesData || []
                ).filter((sale) => {
                    const soldAt = new Date(
                        sale.sold_at
                    );

                    return (
                        soldAt >= yesterdayStart &&
                        soldAt < todayStart
                    );
                });

                // =========================
                // TOTAL REVENUE
                // =========================

                const todayTotal =
                    todaySales.reduce(
                        (sum, sale) =>
                            sum +
                            Number(
                                sale.total_price
                            ),
                        0
                    );

                const yesterdayTotal =
                    yesterdaySales.reduce(
                        (sum, sale) =>
                            sum +
                            Number(
                                sale.total_price
                            ),
                        0
                    );

                setTotalMasuk(todayTotal);

                // =========================
                // GROWTH
                // =========================

                if (yesterdayTotal === 0) {
                    setGrowthPercent(
                        todayTotal > 0 ? 100 : 0
                    );
                } else {
                    const percent =
                        ((todayTotal -
                            yesterdayTotal) /
                            yesterdayTotal) *
                        100;

                    setGrowthPercent(
                        Math.round(percent)
                    );
                }

                // =========================
                // TOP MENU TODAY
                // =========================

                const menuTotals = {};

                todaySales.forEach((sale) => {
                    const menuId = sale.menu_id;

                    if (!menuTotals[menuId]) {
                        menuTotals[menuId] = {
                            name:
                                sale.menus?.name ||
                                "Menu",
                            total_porsi: 0,
                        };
                    }

                    menuTotals[
                        menuId
                    ].total_porsi += Number(
                        sale.quantity
                    );
                });

                const sortedMenus =
                    Object.values(
                        menuTotals
                    ).sort(
                        (a, b) =>
                            b.total_porsi -
                            a.total_porsi
                    );

                setTopMenuToday(
                    sortedMenus[0] || null
                );

                // =========================
                // GET EXPENSES TODAY
                // =========================

                const {
                    data: expensesData,
                    error: expensesError,
                } = await supabase
                    .from("expenses")
                    .select(
                        "amount, spent_at"
                    )
                    .eq(
                        "business_id",
                        currentBusiness.id
                    )
                    .is("deleted_at", null)
                    .gte(
                        "spent_at",
                        todayStart.toISOString()
                    )
                    .lt(
                        "spent_at",
                        tomorrowStart.toISOString()
                    );

                if (expensesError) {
                    console.error(
                        "GAGAL MENGAMBIL EXPENSES:",
                        expensesError
                    );
                } else {
                    const expensesTotal =
                        (
                            expensesData || []
                        ).reduce(
                            (
                                sum,
                                expense
                            ) =>
                                sum +
                                Number(
                                    expense.amount
                                ),
                            0
                        );

                    setTotalBelanja(
                        expensesTotal
                    );
                }

                // =========================
                // GET LOW STOCK
                // =========================

                const {
                    data: inventoryData,
                    error: inventoryError,
                } = await supabase
                    .from("inventory")
                    .select(`
                        stock,
                        minimum_stock,
                        menu_id,
                        menus (
                            id,
                            name
                        )
                    `)
                    .eq(
                        "business_id",
                        currentBusiness.id
                    );

                if (inventoryError) {
                    console.error(
                        "GAGAL MENGAMBIL INVENTORY:",
                        inventoryError
                    );
                } else {
                    const attentionItems =
                        (
                            inventoryData ||
                            []
                        )
                            .filter(
                                (item) =>
                                    item.stock <=
                                    item.minimum_stock
                            )
                            .sort(
                                (a, b) =>
                                    a.stock -
                                    a.minimum_stock -
                                    (b.stock -
                                        b.minimum_stock)
                            );

                    setUrgentLowStock(
                        attentionItems[0] ||
                        null
                    );
                }
            } catch (error) {
                console.error(
                    "QUERY CRASHED:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        getBusinessAndMenus();
    }, []);

    // =========================
    // AI NARRATION
    // =========================
    // Runs once the deterministic numbers above have settled. AI only
    // narrates these already-computed values — it never computes them.
    // On any failure, aiNarrative stays null and the hand-written sentence
    // in the render below is used instead.

    useEffect(() => {
        if (loading || hasNoTransactions) return;

        async function getNarrative() {
            const { data, error } = await supabase.functions.invoke(
                "narrate-dashboard",
                {
                    body: {
                        untung: totalMasuk - totalBelanja,
                        totalMasuk,
                        totalBelanja,
                        growthPercent,
                        topMenuName: topMenuToday?.name ?? null,
                        topMenuPorsi: topMenuToday?.total_porsi ?? null,
                        urgentLowStockName: urgentLowStock?.menus?.name ?? null,
                        urgentLowStockRemaining: urgentLowStock?.stock ?? null,
                    },
                }
            );

            if (!error && data?.narrative) {
                setAiNarrative(data.narrative);
            }
        }

        getNarrative();
    }, [
        loading,
        hasNoTransactions,
        totalMasuk,
        totalBelanja,
        growthPercent,
        topMenuToday,
        urgentLowStock,
    ]);

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f2eb]">
                <NavBar items={navItems} />

                <div className="flex min-h-[70vh] items-center justify-center">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="font-bold text-gray-400"
                    >
                        Memuat data bisnis...
                    </motion.div>
                </div>
            </div>
        );
    }

    // =========================
    // NO TRANSACTION TODAY
    // =========================

    if (hasNoTransactions) {
        return (
            <Navigate
                to="/Beranda/BelumAdaData"
                replace
            />
        );
    }

    const untung =
        totalMasuk - totalBelanja;

    // =========================
    // NORMAL DASHBOARD
    // =========================

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            {/* ================= NAVBAR ================= */}

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <NavBar items={navItems} />
            </motion.div>

            {/* ================= PAGE ================= */}

            <main className="mx-auto max-w-5xl px-6 pb-20">

                {/* ================= GREETING ================= */}

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="pt-10 pb-7"
                >
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Halo, Bu Sari
                    </h1>

                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-gray-400">
                        Minggu, {new Date().toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long"
                        })}
                    </p>
                </motion.div>


                {/* ===================================================== */}
                {/* ================= MAIN SUMMARY ====================== */}
                {/* ===================================================== */}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="
                    relative overflow-hidden
                    rounded-[32px]
                    bg-[#11120f]
                    px-8 py-8
                    shadow-2xl
                "
                >

                    {/* Green glow */}

                    <div
                        className="
                        pointer-events-none
                        absolute
                        -right-20
                        -top-32
                        h-80
                        w-80
                        rounded-full
                        bg-green-700/30
                        blur-3xl
                    "
                    />

                    <div className="relative z-10 flex items-center justify-between">

                        {/* ================= LEFT ================= */}

                        <div className="flex-1">

                            <p className="
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.25em]
                            text-green-500
                        ">
                                Ringkasan Warung Hari Ini
                            </p>


                            {/* PROFIT */}

                            <div className="mt-5 flex items-center gap-4">

                                <h2 className="
                                text-6xl
                                font-extrabold
                                tracking-tight
                                text-white
                            ">
                                    Rp{untung.toLocaleString("id-ID")}
                                </h2>



                            </div>


                            {/* ================= STATS ================= */}

                            <div className="mt-7 flex gap-10">

                                <div>
                                    <p className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.2em]
                                    text-gray-500
                                ">
                                        Total Masuk
                                    </p>

                                    <p className="
                                    mt-1
                                    text-2xl
                                    font-extrabold
                                    text-white
                                ">
                                        Rp{totalMasuk.toLocaleString("id-ID")}
                                    </p>
                                </div>


                                <div>
                                    <p className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.2em]
                                    text-gray-500
                                ">
                                        Total Belanja
                                    </p>

                                    <p className="
                                    mt-1
                                    text-2xl
                                    font-extrabold
                                    text-red-400
                                ">
                                        Rp{totalBelanja.toLocaleString("id-ID")}
                                    </p>
                                </div>


                                <div>
                                    <p className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.2em]
                                    text-gray-500
                                ">
                                        Menu Terlaris
                                    </p>

                                    <p className="
                                    mt-1
                                    text-2xl
                                    font-extrabold
                                    text-white
                                ">
                                        {topMenuToday
                                            ? `${topMenuToday.total_porsi} porsi`
                                            : "0 porsi"
                                        }
                                    </p>
                                </div>

                            </div>

                        </div>


                        {/* ================= ACTIONS ================= */}

                        <div className="flex w-50 flex-col gap-3">

                            <Link to="/Beranda/MulaiCatat">
                                <Button
                                    children="Ada yang Masuk"
                                    bgColor="bg-green-600 hover:bg-green-700"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold"
                                />
                            </Link>


                            <Link to="/Beranda/CatatBelanja">
                                <Button
                                    children="Catat Belanja"
                                    bgColor="bg-orange-800 hover:bg-orange-900"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold"
                                />
                            </Link>

                        </div>

                    </div>

                </motion.div>


                {/* ===================================================== */}
                {/* ================= BOTTOM SECTION ==================== */}
                {/* ===================================================== */}

                <div className="mt-6 grid grid-cols-2 gap-5">


                    {/* ================================================= */}
                    {/* ================= CASH CONDITION ================= */}
                    {/* ================================================= */}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.15
                        }}
                        whileHover={{ y: -3 }}
                        className="
                        flex
                        min-h-[320px]
                        flex-col
                        rounded-[28px]
                        border
                        border-green-300
                        bg-green-50
                        p-7
                        shadow-lg
                    "
                    >

                        {/* TITLE */}

                        <div className="flex items-center gap-3">



                            <p className="
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.2em]
                            text-green-700
                        ">
                                Kondisi Kas Warung
                            </p>

                        </div>


                        {/* LABELS */}

                        <div className="mt-7 flex justify-between">

                            <p className="
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.15em]
                            text-gray-400
                        ">
                                Pemasukan vs Pengeluaran
                            </p>

                            <p className="
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.15em]
                            text-gray-400
                        ">
                                Selisih Kas
                            </p>

                        </div>


                        {/* VALUES */}

                        <div className="mt-2 flex items-center justify-between">

                            <h2 className="
                            text-2xl
                            font-extrabold
                            text-green-700
                        ">
                                {untung >= 0
                                    ? "Uang Mengalir!"
                                    : "Perlu Diperhatikan"
                                }
                            </h2>

                            <p className="
                            text-2xl
                            font-extrabold
                            text-green-700
                        ">
                                Rp{untung.toLocaleString("id-ID")}
                            </p>

                        </div>


                        {/* PROGRESS */}

                        <div className="mt-6">

                            <div className="
                            h-3
                            overflow-hidden
                            rounded-full
                            bg-red-300
                        ">

                                <div
                                    className="h-full rounded-full bg-green-600"
                                    style={{
                                        width:
                                            totalMasuk === 0
                                                ? "0%"
                                                : `${Math.min(
                                                    100,
                                                    (totalMasuk /
                                                        (totalMasuk +
                                                            totalBelanja)) *
                                                    100
                                                )}%`
                                    }}
                                />

                            </div>

                        </div>


                        {/* MESSAGE */}

                        <div className="
                        mt-6
                        rounded-2xl
                        bg-white
                        px-5
                        py-4
                        text-sm
                        font-semibold
                        text-gray-500
                        shadow-sm
                    ">

                            {" "}
                            {aiNarrative ??
                                (untung >= 0
                                    ? "Mantap Bu! Jualan hari ini sudah menutup modal belanja."
                                    : "Pengeluaran hari ini lebih besar dari pemasukan."
                                )
                            }

                        </div>


                        {/* BUTTON */}

                        <div className="mt-auto pt-6">

                            <Link to="/Beranda/Catatan">

                                <Button
                                    children="Lihat Riwayat Transaksi →"
                                    bgColor="bg-orange-800 hover:bg-orange-900"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold"
                                />

                            </Link>

                        </div>

                    </motion.div>


                    {/* ================================================= */}
                    {/* ================= ADVICE CARD =================== */}
                    {/* ================================================= */}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.25
                        }}
                        whileHover={{ y: -3 }}
                        className="
                        flex
                        min-h-[320px]
                        flex-col
                        rounded-[28px]
                        border
                        border-orange-200
                        bg-orange-50
                        p-7
                        shadow-lg
                    "
                    >

                        {/* TITLE */}

                        <div className="flex items-center gap-3">



                            <p className="
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.2em]
                            text-orange-800
                        ">
                                Saran Buat Ibu
                            </p>

                        </div>


                        {/* ADVICE */}

                        <div className="mt-7">

                            <h2 className="
                            text-2xl
                            font-extrabold
                            leading-tight
                            text-gray-900
                        ">

                                {urgentLowStock ? (
                                    <>
                                        Stok{" "}
                                        <span className="text-green-700">
                                            {urgentLowStock.menus?.name}
                                        </span>{" "}
                                        tinggal sedikit lagi.
                                    </>
                                ) : topMenuToday ? (
                                    <>
                                        Wah, jualan{" "}
                                        <span className="text-green-700">
                                            {topMenuToday.name}
                                        </span>{" "}
                                        Ibu paling laku hari ini!
                                    </>
                                ) : (
                                    "Belum ada saran untuk hari ini."
                                )}

                            </h2>

                        </div>


                        {/* DESCRIPTION */}

                        <p className="
                        mt-5
                        text-sm
                        font-semibold
                        italic
                        leading-6
                        text-gray-500
                    ">

                            {urgentLowStock ? (
                                <>
                                    Stok tersisa{" "}
                                    <span className="font-extrabold">
                                        {urgentLowStock.stock}
                                    </span>
                                    . Jangan lupa belanja lagi supaya
                                    tidak kehabisan saat jam makan siang.
                                </>
                            ) : topMenuToday ? (
                                <>
                                    Menu ini sudah menjadi menu dengan
                                    penjualan tertinggi hari ini.
                                    Pertahankan stoknya supaya tetap aman.
                                </>
                            ) : (
                                "Catat transaksi terlebih dahulu supaya kami bisa memberikan saran untuk Ibu."
                            )}

                        </p>


                        {/* BUTTON */}

                        <div className="mt-auto pt-6">

                            <Link to="/Beranda/CatatBelanja">

                                <Button
                                    children="Catat Belanja Sekarang →"
                                    bgColor="bg-orange-800 hover:bg-orange-900"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold"
                                />

                            </Link>

                        </div>

                    </motion.div>

                </div>

            </main>
        </div>
    );
}

export default Beranda;