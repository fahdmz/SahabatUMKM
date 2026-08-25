import { motion } from "motion/react";
import NavBar from "../components/Navbar";
import LakuCards from "../components/LakuCards";
import SaranMenuCards from "../components/SaranMenuCards";
import FilterBar from "../components/FilterBar";
import ButuhPerhatianCards from "../components/ButuhPerhatianCards";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function MenuLaku() {
    const [recommendations, setRecommendations] = useState([]);
    const [previousSales, setPreviousSales] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [salesSummary, setSalesSummary] = useState([]);
    const [activeFilter, setActiveFilter] = useState("today");
    const [allSales, setAllSales] = useState([]);

    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    // =========================
    // GET DATA FROM SUPABASE
    // =========================

    useEffect(() => {
        async function getSalesData() {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                console.error("USER ERROR:", userError);
                return;
            }

            if (!user) {
                console.log("BELUM LOGIN");
                return;
            }

            try {
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

                // =========================
                // GET INVENTORY
                // =========================

                const {
                    data: inventoryData,
                    error: inventoryError,
                } = await supabase
                    .from("inventory")
                    .select(`
                        id,
                        stock,
                        minimum_stock,
                        menu_id,
                        menus (
                            id,
                            name
                        )
                    `)
                    .eq("business_id", currentBusiness.id);

                if (inventoryError) {
                    console.error(
                        "GAGAL MENGAMBIL INVENTORY:",
                        inventoryError
                    );
                    return;
                }

                const attentionItems = (inventoryData || []).filter(
                    (item) => item.stock <= item.minimum_stock
                );

                setLowStockItems(attentionItems);

                // =========================
                // GET ALL SALES
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
                    .eq("business_id", currentBusiness.id);

                if (salesError) {
                    console.error(
                        "GAGAL MENGAMBIL SALES:",
                        salesError
                    );
                    return;
                }

                setAllSales(salesData || []);

            } catch (error) {
                console.error("SALES QUERY CRASHED:", error);
            }
        }

        getSalesData();
    }, []);

    // =========================
    // FILTER + GROUP SALES
    // =========================

    useEffect(() => {
        let startDate = new Date();
        let previousStartDate;
        let previousEndDate;

        // =========================
        // TODAY
        // =========================

        if (activeFilter === "today") {
            startDate.setHours(0, 0, 0, 0);

            previousStartDate = new Date(startDate);
            previousStartDate.setDate(
                previousStartDate.getDate() - 1
            );

            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
        }

        // =========================
        // WEEK
        // =========================

        if (activeFilter === "week") {
            startDate.setDate(
                startDate.getDate() - 6
            );

            startDate.setHours(0, 0, 0, 0);

            previousStartDate = new Date(startDate);
            previousStartDate.setDate(
                previousStartDate.getDate() - 7
            );

            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
        }

        // =========================
        // MONTH
        // =========================

        if (activeFilter === "month") {
            startDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                1
            );

            previousStartDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth() - 1,
                1
            );

            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
        }

        // =========================
        // CURRENT SALES
        // =========================

        const filteredSales = allSales.filter((sale) => {
            return new Date(sale.sold_at) >= startDate;
        });

        // =========================
        // PREVIOUS SALES
        // =========================

        const filteredPreviousSales = allSales.filter((sale) => {
            const soldAt = new Date(sale.sold_at);

            return (
                soldAt >= previousStartDate &&
                soldAt <= previousEndDate
            );
        });

        // =========================
        // GROUP CURRENT SALES
        // =========================

        const summary = {};

        filteredSales.forEach((sale) => {
            const menuId = sale.menu_id;

            if (!summary[menuId]) {
                summary[menuId] = {
                    id: menuId,
                    name: sale.menus?.name || "Menu",
                    total_porsi: 0,
                    total_pemasukan: 0,
                };
            }

            summary[menuId].total_porsi += sale.quantity;
            summary[menuId].total_pemasukan += sale.total_price;
        });

        const summaryData = Object.values(summary);

        summaryData.sort(
            (a, b) => b.total_porsi - a.total_porsi
        );

        setSalesSummary(summaryData);

        // =========================
        // GROUP PREVIOUS SALES
        // =========================

        const previousSummary = {};

        filteredPreviousSales.forEach((sale) => {
            const menuId = sale.menu_id;

            if (!previousSummary[menuId]) {
                previousSummary[menuId] = {
                    total_porsi: 0,
                };
            }

            previousSummary[menuId].total_porsi += sale.quantity;
        });

        // =========================
        // RECOMMENDATIONS
        // =========================

        const lowStockMenuIds = new Set(
            lowStockItems.map((item) => item.menu_id)
        );

        const recommended = summaryData
            .filter(
                (item) => !lowStockMenuIds.has(item.id)
            )
            .map((item) => {
                const previousPorsi =
                    previousSummary[item.id]?.total_porsi || 0;

                const growth =
                    item.total_porsi - previousPorsi;

                let deskripsi;

                if (growth > 0) {
                    deskripsi = `${item.name} lagi naik daun periode ini, naik ${growth} porsi dibanding periode sebelumnya.`;
                } else if (growth < 0) {
                    deskripsi = `${item.name} masih laku, tapi turun ${Math.abs(growth)} porsi dibanding periode sebelumnya.`;
                } else {
                    deskripsi = `${item.name} penjualannya stabil dibanding periode sebelumnya.`;
                }

                const alasan =
                    `Periode ini terjual ${item.total_porsi} porsi (sebelumnya ${previousPorsi} porsi), dengan pemasukan sekitar Rp${item.total_pemasukan.toLocaleString("id-ID")}.`;

                return {
                    id: item.id,
                    NamaMenu: item.name,
                    Deskripsi: deskripsi,
                    Alasan: alasan,
                    growth,
                };
            })
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 3);

        setRecommendations(recommended);
        setPreviousSales(filteredPreviousSales);

    }, [activeFilter, allSales, lowStockItems]);

    // =========================
    // ANIMATION
    // =========================

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.45,
                ease: "easeOut",
            },
        },
    };

    // =========================
    // DATE
    // =========================

    const today = new Date();

    const formattedDate = today.toLocaleDateString(
        "id-ID",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
        }
    );

    return (
        <>
            <NavBar items={navItems} />

            <main className="min-h-screen bg-[#f7f4ee]">

                <div className="mx-auto w-full max-w-5xl px-8 pb-20">

                    {/* =========================
                        PAGE HEADER
                    ========================= */}

                    <motion.section
                        initial={{
                            opacity: 0,
                            y: 15,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.5,
                        }}
                        className="pt-10"
                    >
                        <h1 className="text-3xl font-extrabold tracking-tight text-black">
                            Laris Mana?
                        </h1>

                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                            {formattedDate}
                        </p>
                    </motion.section>


                    {/* =========================
                        TITLE + FILTER
                    ========================= */}

                    <motion.section
                        initial={{
                            opacity: 0,
                            y: 15,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.1,
                        }}
                        className="mt-9 flex items-end justify-between gap-6"
                    >

                        <div>
                            <h2 className="text-2xl font-extrabold text-black">
                                Masakan Mana yang Paling Laris?
                            </h2>

                            <p className="mt-2 text-sm font-semibold text-gray-500">
                                Lihat menu mana yang paling disukai pelanggan ibu.
                            </p>
                        </div>

                        <FilterBar
                            activeFilter={activeFilter}
                            setActiveFilter={setActiveFilter}
                        />

                    </motion.section>


                    {/* =========================
                        MAIN CONTENT
                    ========================= */}

                    <motion.section
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="mt-8 grid grid-cols-[1.15fr_0.85fr] gap-6"
                    >

                        {/* =========================
                            LEFT — PALING LAKU
                        ========================= */}

                        <motion.div
                            variants={itemVariants}
                        >

                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-6 w-1.5 rounded-full bg-green-600" />

                                <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">
                                    Paling Laku Juara
                                </h3>
                            </div>

                            {salesSummary.length === 0 ? (

                                <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/50 px-6 text-center">

                                    <div>
                                        <p className="text-sm font-extrabold text-gray-400">
                                            {activeFilter === "today" &&
                                                "Belum ada penjualan hari ini."}

                                            {activeFilter === "week" &&
                                                "Belum ada penjualan minggu ini."}

                                            {activeFilter === "month" &&
                                                "Belum ada penjualan bulan ini."}
                                        </p>

                                        <p className="mt-2 text-xs font-semibold text-gray-400">
                                            Data menu yang laku akan muncul di sini.
                                        </p>
                                    </div>

                                </div>

                            ) : (

                                <LakuCards
                                    sales={salesSummary}
                                />

                            )}

                        </motion.div>


                        {/* =========================
                            RIGHT SIDE
                        ========================= */}

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col gap-7"
                        >

                            {/* =========================
                                SARAN MENU
                            ========================= */}

                            <div>

                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-6 w-1.5 rounded-full bg-orange-400" />

                                    <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">
                                        Saran Menu
                                    </h3>
                                </div>

                                <SaranMenuCards
                                    recommendations={recommendations}
                                />

                            </div>


                            {/* =========================
                                BUTUH PERHATIAN
                            ========================= */}

                            <div>

                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-6 w-1.5 rounded-full bg-gray-300" />

                                    <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">
                                        Butuh Perhatian
                                    </h3>
                                </div>

                                <ButuhPerhatianCards
                                    lowStockItems={lowStockItems}
                                />

                            </div>

                        </motion.div>

                    </motion.section>

                </div>

            </main>
        </>
    );
}

export default MenuLaku;