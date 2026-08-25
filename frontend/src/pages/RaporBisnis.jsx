import NavBar from "../components/Navbar";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import GradeCards from "../components/gradeCards";
import BoxInformation from "../components/Box-Information";
import Button from "../components/Button";

function RaporBisnis() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    useEffect(() => {
        async function getReportData() {
            console.log("=== GET RAPOR DATA ===");

            setLoading(true);

            try {
                // =========================
                // GET CURRENT USER
                // =========================

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("USER ERROR:", userError);
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
                    .select("*")
                    .eq("owner_id", user.id);

                if (businessError) {
                    console.error("BUSINESS ERROR:", businessError);
                    return;
                }

                if (!businessData || businessData.length === 0) {
                    console.log("USER BELUM MEMILIKI BUSINESS");
                    return;
                }

                const currentBusiness = businessData[0];

                // =========================
                // DATE RANGE
                // =========================

                const now = new Date();

                // The month before the reported month — growth is measured
                // against this, not against the still-in-progress current
                // month (that was the bug: comparing a partial month to a
                // full one always looked like a decline).
                const monthBeforePrevStart = new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                );

                // Previous month — this is the month the report is about.
                const previousMonthStart = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                );

                // Current month
                const currentMonthStart = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );

                // =========================
                // GET SALES
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
                    .eq("business_id", currentBusiness.id)
                    .is("deleted_at", null)
                    .gte(
                        "sold_at",
                        monthBeforePrevStart.toISOString()
                    )
                    .lt(
                        "sold_at",
                        new Date(
                            now.getFullYear(),
                            now.getMonth() + 1,
                            1
                        ).toISOString()
                    );

                if (salesError) {
                    console.error("SALES ERROR:", salesError);
                    return;
                }

                // =========================
                // SPLIT SALES
                // =========================

                const currentSales = salesData.filter((sale) => {
                    const date = new Date(sale.sold_at);

                    return (
                        date >= currentMonthStart
                    );
                });

                const previousSales = salesData.filter((sale) => {
                    const date = new Date(sale.sold_at);

                    return (
                        date >= previousMonthStart &&
                        date < currentMonthStart
                    );
                });

                const monthBeforePrevSales = salesData.filter((sale) => {
                    const date = new Date(sale.sold_at);

                    return (
                        date >= monthBeforePrevStart &&
                        date < previousMonthStart
                    );
                });

                // =========================
                // TOTAL REVENUE
                // =========================

                const currentRevenue = currentSales.reduce(
                    (total, sale) =>
                        total + sale.total_price,
                    0
                );

                const previousRevenue = previousSales.reduce(
                    (total, sale) =>
                        total + sale.total_price,
                    0
                );

                const monthBeforePrevRevenue = monthBeforePrevSales.reduce(
                    (total, sale) =>
                        total + sale.total_price,
                    0
                );

                // =========================
                // TOTAL PORTIONS
                // =========================

                const currentPortions = currentSales.reduce(
                    (total, sale) =>
                        total + sale.quantity,
                    0
                );

                const previousPortions = previousSales.reduce(
                    (total, sale) =>
                        total + sale.quantity,
                    0
                );

                // =========================
                // REVENUE CHANGE
                // =========================
                // reportMonth (previousRevenue) vs the month before it
                // (monthBeforePrevRevenue) — NOT vs the still-in-progress
                // current month, which would always be a partial-vs-full
                // comparison and misreport growth.

                let revenueChange = 0;

                if (monthBeforePrevRevenue > 0) {
                    revenueChange =
                        ((previousRevenue - monthBeforePrevRevenue) /
                            monthBeforePrevRevenue) *
                        100;
                }

                // =========================
                // ACTIVE DAYS
                // =========================

                const activeDays = new Set(
                    previousSales.map((sale) =>
                        new Date(sale.sold_at)
                            .toISOString()
                            .split("T")[0]
                    )
                );

                // =========================
                // MENU PERFORMANCE
                // =========================

                const menuSummary = {};

                previousSales.forEach((sale) => {
                    const menuId = sale.menu_id;

                    if (!menuSummary[menuId]) {
                        menuSummary[menuId] = {
                            id: menuId,
                            name: sale.menus.name,
                            total_porsi: 0,
                            total_pemasukan: 0,
                        };
                    }

                    menuSummary[menuId].total_porsi +=
                        sale.quantity;

                    menuSummary[menuId].total_pemasukan +=
                        sale.total_price;
                });

                const menuPerformance =
                    Object.values(menuSummary);

                menuPerformance.sort(
                    (a, b) =>
                        b.total_pemasukan -
                        a.total_pemasukan
                );

                // =========================
                // FINAL DATA
                // =========================

                const result = {
                    business: currentBusiness,

                    reportMonth:
                        previousMonthStart.toLocaleDateString(
                            "id-ID",
                            {
                                month: "long",
                            }
                        ),

                    currentRevenue,
                    previousRevenue,

                    currentPortions,
                    previousPortions,

                    revenueChange,

                    activeDays: activeDays.size,
                    transactionCount: previousSales.length,

                    menuPerformance,

                    currentSales,
                    previousSales,
                };

                console.log(
                    "=== FINAL RAPOR DATA ===",
                    result
                );

                setReportData(result);

            } catch (error) {
                console.error(
                    "RAPOR QUERY CRASHED:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        getReportData();
    }, []);

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f2eb]">
                <NavBar items={navItems} />

                <div className="flex min-h-[70vh] items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-bold text-gray-400"
                    >
                        Lagi nyiapin rapor warung Ibu...
                    </motion.div>
                </div>
            </div>
        );
    }

    // =========================
    // NO DATA
    // =========================

    if (!reportData) {
        return (
            <div className="min-h-screen bg-[#f5f2eb]">
                <NavBar items={navItems} />

                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold">
                            Belum ada data rapor
                        </h2>

                        <p className="mt-3 text-gray-500">
                            Pastikan warung Ibu sudah memiliki
                            data penjualan.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================
    // REPORT VARIABLES
    // =========================

    const {
        reportMonth,
        currentRevenue,
        previousRevenue,
        revenueChange,
        activeDays,
        transactionCount,
        menuPerformance,
    } = reportData;

    const topMenu = menuPerformance[0];

    // =========================
    // ENOUGH DATA TO GRADE?
    // =========================
    // A handful of sales shouldn't earn a letter grade — below this, the
    // report shows an honest "belum cukup data" instead of A/B/C.

    const MIN_ACTIVE_DAYS_FOR_GRADE = 10;
    const MIN_TRANSACTIONS_FOR_GRADE = 20;

    const hasEnoughDataToGrade =
        activeDays >= MIN_ACTIVE_DAYS_FOR_GRADE &&
        transactionCount >= MIN_TRANSACTIONS_FOR_GRADE;

    // =========================
    // GRADE CALCULATION
    // =========================

    let consistencyGrade = "C";

    if (activeDays >= 25) {
        consistencyGrade = "A";
    } else if (activeDays >= 20) {
        consistencyGrade = "B";
    }

    let revenueGrade = "C";

    if (revenueChange >= 15) {
        revenueGrade = "A";
    } else if (revenueChange >= 5) {
        revenueGrade = "B";
    }

    // Menu concentration: how much of the month's revenue leaned on the
    // single best-selling item. Heavy reliance on one menu is a real
    // business risk (one bad batch/ingredient shortage tanks the month),
    // so LOW concentration grades better than high concentration.
    let menuGrade = "C";
    let menuConcentration = null;

    if (topMenu && previousRevenue > 0) {
        menuConcentration = topMenu.total_pemasukan / previousRevenue;

        if (menuConcentration <= 0.5) {
            menuGrade = "A";
        } else if (menuConcentration <= 0.75) {
            menuGrade = "B";
        }
    }

    // =========================
    // NOT ENOUGH DATA YET
    // =========================

    if (!hasEnoughDataToGrade) {
        return (
            <div className="min-h-screen bg-[#f5f2eb]">
                <NavBar items={navItems} />

                <div className="flex min-h-[70vh] items-center justify-center px-6">
                    <div className="max-w-md text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Belum Cukup Data
                        </h2>

                        <p className="mt-3 font-semibold text-gray-500">
                            Rapor bulan {reportMonth} baru bisa dinilai
                            kalau Ibu sudah catat minimal{" "}
                            {MIN_ACTIVE_DAYS_FOR_GRADE} hari dan{" "}
                            {MIN_TRANSACTIONS_FOR_GRADE} transaksi.
                            Sejauh ini baru {activeDays} hari dan{" "}
                            {transactionCount} transaksi.
                        </p>

                        <p className="mt-3 text-sm font-bold text-gray-400">
                            Terus catat jualan tiap hari ya, Bu — rapornya
                            bakal muncul begitu datanya cukup.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================
    // FORMATTERS
    // =========================

    function formatRupiah(value) {
        return new Intl.NumberFormat(
            "id-ID"
        ).format(value);
    }

    function formatPercentage(value) {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    }

    // =========================
    // WHATSAPP SHARE
    // =========================

    const waShareText = encodeURIComponent(
        `Rapor ${reportMonth}: Pendapatan Rp${formatRupiah(previousRevenue)}, ${revenueChange >= 0 ? "naik" : "turun"
        } ${formatPercentage(Math.abs(revenueChange))} dibanding bulan sebelumnya.`
    );

    // =========================
    // ANIMATION
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
                duration: 0.6,
                ease: "easeOut",
            },
        },
    };

    return (
        <div className="min-h-screen bg-[#f5f2eb]">

            {/* NAVBAR */}

            <motion.div
                initial={{
                    opacity: 0,
                    y: -20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeOut",
                }}
            >
                <NavBar items={navItems} />
            </motion.div>

            <main className="mx-auto max-w-7xl px-6 pb-24 lg:px-12">

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="pt-10"
                >

                    {/* PAGE TITLE */}

                    <motion.section
                        variants={itemVariants}
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#171512]">
                            Rapor {reportMonth}
                        </h1>

                        <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gray-400">
                            Rangkuman performa warung Ibu
                        </p>
                    </motion.section>


                    {/* HEADER */}

                    <motion.section
                        variants={itemVariants}
                        className="mx-auto mt-16 flex max-w-5xl items-center justify-between gap-8"
                    >

                        <div>
                            <h2 className="text-4xl font-extrabold tracking-tight text-[#171512]">
                                Rapor Bisnis {reportMonth}
                            </h2>

                            <p className="mt-2 text-lg font-bold text-gray-500">
                                Ibarat rapor sekolah, ini rapor warung Ibu.
                            </p>
                        </div>

                        <motion.div
                            whileHover={{
                                scale: 1.04,
                                rotate: -2,
                            }}
                            className="flex h-22 w-22 shrink-0 items-center justify-center rounded-[2rem] bg-[#171512] shadow-xl"
                        >
                            <span className="text-6xl font-extrabold text-green-600">
                                {revenueGrade}
                            </span>
                        </motion.div>

                    </motion.section>


                    {/* HERO REPORT */}

                    <motion.section
                        variants={itemVariants}
                        className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[3rem] bg-[#171512] p-10 shadow-2xl md:p-12"
                    >

                        <div className="inline-flex rounded-full bg-white/10 px-4 py-2">
                            <span className="text-xs font-extrabold tracking-[0.2em] text-gray-300">
                                KABAR {reportMonth.toUpperCase()}
                            </span>
                        </div>

                        <h3 className="mt-8 max-w-4xl text-3xl font-extrabold leading-tight text-white md:text-4xl">

                            {revenueChange >= 0
                                ? `Untung warung Ibu naik ${formatPercentage(
                                    revenueChange
                                )} dibanding bulan sebelumnya.`
                                : `Untung warung Ibu turun ${formatPercentage(
                                    Math.abs(revenueChange)
                                )} dibanding bulan sebelumnya.`}

                        </h3>

                        <div className="mt-10 flex flex-wrap gap-8">

                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500" />

                                <span className="text-sm font-bold text-gray-300">
                                    {activeDays} Hari Tercatat
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />

                                <span className="text-sm font-bold text-gray-300">
                                    Rp{formatRupiah(
                                        previousRevenue
                                    )} Pendapatan
                                </span>
                            </div>

                        </div>

                    </motion.section>


                    {/* GRADE CARDS */}

                    <motion.section
                        variants={itemVariants}
                        className="mx-auto mt-10 flex max-w-5xl justify-center"
                    >
                        <GradeCards
                            grades={[
                                {
                                    title: "Konsistensi",
                                    grade: consistencyGrade,
                                    description:
                                        `Ibu mencatat jualan selama ${activeDays} hari pada bulan ${reportMonth}.`,
                                },
                                {
                                    title: "Cuan (Keuntungan)",
                                    grade: revenueGrade,
                                    description:
                                        `Pendapatan bulan ini ${formatPercentage(
                                            revenueChange
                                        )} dibanding bulan sebelumnya.`,
                                },
                                {
                                    title: "Pilihan Menu",
                                    grade: menuGrade,
                                    description:
                                        topMenu
                                            ? `${topMenu.name} menyumbang ${Math.round(
                                                menuConcentration * 100
                                            )}% dari pendapatan bulan ini. ${menuGrade === "A"
                                                ? "Menu warung Ibu sudah cukup beragam."
                                                : menuGrade === "B"
                                                    ? "Sebagian besar pendapatan masih dari satu menu."
                                                    : "Warung Ibu terlalu bergantung pada satu menu — coba kembangkan menu lain."
                                            }`
                                            : "Belum ada data menu yang cukup untuk dinilai.",
                                },
                            ]}
                        />
                    </motion.section>


                    {/* BOTTOM */}

                    <motion.section
                        variants={containerVariants}
                        className="mx-auto mt-10 grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-2"
                    >

                        {/* TIPS */}

                        <motion.div
                            variants={itemVariants}
                            className="h-[380px]"
                        >
                            <BoxInformation
                                title="Performa Bulan Ini"
                                description={
                                    revenueChange >= 0
                                        ? "Pendapatan warung Ibu sedang tumbuh dibanding bulan sebelumnya."
                                        : "Pendapatan warung Ibu sedang menurun. Coba perhatikan menu yang paling banyak terjual."
                                }
                                totalHemat={formatRupiah(
                                    Math.max(
                                        0,
                                        currentRevenue -
                                        previousRevenue
                                    )
                                )}
                            />
                        </motion.div>


                        {/* GOOD NEWS */}

                        <motion.div
                            variants={itemVariants}
                            className="h-[380px]"
                        >
                            <motion.div
                                whileHover={{
                                    y: -5,
                                    scale: 1.01,
                                }}
                                className="flex h-full flex-col items-center justify-center rounded-[2rem] bg-white p-10 text-center shadow-lg"
                            >

                                <motion.div
                                    whileHover={{
                                        rotate: 8,
                                        scale: 1.08,
                                    }}
                                    className="mb-8 flex h-18 w-18 items-center justify-center rounded-full bg-green-50"
                                >
                                    <span className="text-3xl text-green-600">
                                        ↗
                                    </span>
                                </motion.div>

                                <h3 className="text-2xl font-extrabold text-[#171512]">
                                    Kasih Tahu Kabar Baik
                                </h3>

                                <p className="mt-4 max-w-sm text-lg font-bold leading-relaxed text-gray-400">
                                    Pendapatan bulan {reportMonth}:
                                    <br />
                                    <span className="text-2xl text-[#171512]">
                                        Rp{formatRupiah(
                                            previousRevenue
                                        )}
                                    </span>
                                </p>

                                <div className="mt-10 w-full max-w-sm">
                                    <a
                                        href={`https://wa.me/?text=${waShareText}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button
                                            bgColor="bg-white"
                                            borderColor="border-black"
                                            children="Kirim ke WA Bapak →"
                                            textColor="text-black"
                                            font="font-extrabold"
                                        />
                                    </a>
                                </div>

                            </motion.div>
                        </motion.div>

                    </motion.section>

                </motion.div>
            </main>
        </div>
    );
}

export default RaporBisnis;