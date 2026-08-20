import { motion } from "motion/react";
import NavBar from "../components/Navbar";
import LakuCards from "../components/LakuCards";
import SaranMenuCards from "../components/SaranMenuCards";
import FilterBar from "../components/FilterBar";
import ButuhPerhatianCards from "../components/ButuhPerhatianCards";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function MenuLaku() {
    const [reccommendations, setRecommendations] = useState([]);
    const [previousSales, setPreviousSales] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [salesSummary, setSalesSummary] = useState([]);
    const [activeFilter, setActiveFilter] = useState("today");
    const [allSales, setAllSales] = useState([]);
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
    ];

    useEffect(() => {
        async function getSalesData() {
            console.log("=== GET SALES DATA ===");

            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            console.log("USER:", user);
            console.log("USER ERROR:", userError);

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
                    error: businessError
                } = await supabase
                    .from("businesses")
                    .select("*")
                    .eq("owner_id", user.id);

                console.log("BUSINESS:", businessData);
                console.log("BUSINESS ERROR:", businessError);

                if (businessError) {
                    console.error(
                        "GAGAL MENGAMBIL BUSINESS:",
                        businessError
                    );
                    return;
                }

                if (businessData.length === 0) {
                    console.log("USER BELUM MEMILIKI BUSINESS");
                    return;
                }

                const currentBusiness = businessData[0];

                // =========================
                // GET INVENTORY
                // =========================
                const {
                    data: inventoryData,
                    error: inventoryError
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

                console.log("INVENTORY:", inventoryData);
                console.log("INVENTORY ERROR:", inventoryError);

                if (inventoryError) {
                    console.error(
                        "GAGAL MENGAMBIL INVENTORY:",
                        inventoryError
                    );
                    return;
                }

                const attentionItems = inventoryData.filter(
                    (item) => item.stock <= item.minimum_stock
                );

                console.log("LOW STOCK:", attentionItems);

                setLowStockItems(attentionItems);

                // =========================
                // GET ALL SALES
                // =========================
                const {
                    data: salesData,
                    error: salesError
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

                console.log("ALL SALES:", salesData);
                console.log("SALES ERROR:", salesError);

                if (salesError) {
                    console.error(
                        "GAGAL MENGAMBIL SALES:",
                        salesError
                    );
                    return;
                }

                // Simpan semua sales
                setAllSales(salesData || []);

            } catch (error) {
                console.error(
                    "SALES QUERY CRASHED:",
                    error
                );
            }
        }

        getSalesData();
    }, []);


    // =========================
    // FILTER SALES LOCALLY
    // =========================
    useEffect(() => {
        console.log("=== FILTER SALES ===");
        console.log("ACTIVE FILTER:", activeFilter);

        // =========================
        // CURRENT PERIOD
        // =========================

        let startDate = new Date();
        let previousStartDate;
        let previousEndDate;

        if (activeFilter === "today") {
            // Today
            startDate.setHours(0, 0, 0, 0);

            // Yesterday
            previousStartDate = new Date(startDate);
            previousStartDate.setDate(
                previousStartDate.getDate() - 1
            );

            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
        }

        if (activeFilter === "week") {
            // Last 7 days
            startDate.setDate(
                startDate.getDate() - 6
            );
            startDate.setHours(0, 0, 0, 0);

            // Previous 7 days
            previousStartDate = new Date(startDate);
            previousStartDate.setDate(
                previousStartDate.getDate() - 7
            );

            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
        }

        if (activeFilter === "month") {
            // Current month
            startDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                1
            );

            // Previous month
            previousStartDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth() - 1,
                1
            );

            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
        }

        console.log(
            "CURRENT START:",
            startDate.toISOString()
        );

        console.log(
            "PREVIOUS START:",
            previousStartDate.toISOString()
        );

        console.log(
            "PREVIOUS END:",
            previousEndDate.toISOString()
        );

        // =========================
        // CURRENT SALES
        // =========================

        const filteredSales = allSales.filter((sale) => {
            const soldAt = new Date(sale.sold_at);

            return soldAt >= startDate;
        });

        console.log("CURRENT SALES:", filteredSales);

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

        console.log(
            "PREVIOUS SALES:",
            filteredPreviousSales
        );

        // =========================
        // GROUP CURRENT SALES
        // =========================

        const summary = {};

        filteredSales.forEach((sale) => {
            const menuId = sale.menu_id;

            if (!summary[menuId]) {
                summary[menuId] = {
                    id: menuId,
                    name: sale.menus.name,
                    total_porsi: 0,
                    total_pemasukan: 0
                };
            }

            summary[menuId].total_porsi += sale.quantity;
            summary[menuId].total_pemasukan += sale.total_price;
        });

        const summaryData = Object.values(summary);

        // Most sold → least sold
        summaryData.sort(
            (a, b) => b.total_porsi - a.total_porsi
        );

        console.log(
            "SALES SUMMARY:",
            summaryData
        );

        setSalesSummary(summaryData);

        const previousSummary = {};

        filteredPreviousSales.forEach((sale) => {
            const menuId = sale.menu_id;

            if (!previousSummary[menuId]) {
                previousSummary[menuId] = { total_porsi: 0 };
            }

            previousSummary[menuId].total_porsi += sale.quantity;
        });

        // =========================
        // BUILD RECOMMENDATIONS (biggest growth vs previous period)
        // =========================

        const lowStockMenuIds = new Set(
            lowStockItems.map((item) => item.menu_id)
        );

        const recommended = summaryData
            .filter((item) => !lowStockMenuIds.has(item.id))
            .map((item) => {
                const previousPorsi =
                    previousSummary[item.id]?.total_porsi || 0;
                const growth = item.total_porsi - previousPorsi;

                let deskripsi;
                if (growth > 0) {
                    deskripsi = `${item.name} lagi naik daun periode ini, naik ${growth} porsi dibanding periode sebelumnya.`;
                } else if (growth < 0) {
                    deskripsi = `${item.name} masih laku, tapi turun ${Math.abs(growth)} porsi dibanding periode sebelumnya.`;
                } else {
                    deskripsi = `${item.name} penjualannya stabil dibanding periode sebelumnya.`;
                }

                const alasan = `Periode ini terjual ${item.total_porsi} porsi (sebelumnya ${previousPorsi} porsi), dengan pemasukan sekitar Rp${item.total_pemasukan.toLocaleString("id-ID")}.`;

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

        console.log("RECOMMENDATIONS:", recommended);

        setRecommendations(recommended);

        // =========================
        // SAVE PREVIOUS SALES
        // =========================

        setPreviousSales(filteredPreviousSales);

    }, [activeFilter, allSales]);
    // Animation variants
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
                duration: 0.5,
                ease: "easeOut",
            },
        },
    };

    return (
        <>
            {/* NAVBAR */}
            <NavBar items={navItems} />

            <main className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">

                {/* PAGE HEADER */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut",
                    }}
                    className="pt-10"
                >
                    <h1 className="text-4xl font-extrabold text-black">
                        Laris Mana?
                    </h1>

                    <p className="mt-2 px-2 text-lg font-bold text-gray-500">
                        Senin, 17 Agustus
                    </p>
                </motion.section>


                {/* TITLE + FILTER */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.15,
                        ease: "easeOut",
                    }}
                    className="mt-10 flex items-start justify-between gap-10"
                >
                    <div>
                        <h2 className="text-3xl font-bold text-black">
                            Masakan Mana yang Paling Laris?
                        </h2>

                        <p className="mt-2 text-lg text-gray-500">
                            Lihat menu mana yang paling disukai pelanggan ibu.
                        </p>
                    </div>

                    {/* FILTER */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FilterBar
                            activeFilter={activeFilter}
                            setActiveFilter={setActiveFilter}
                        />
                    </motion.div>
                </motion.section>


                {/* CONTENT */}
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-10 flex items-start gap-12"
                >

                    {/* MOST POPULAR */}
                    <motion.div
                        variants={itemVariants}
                        className="flex-1"
                    >
                        <h3 className="text-lg font-extrabold text-gray-500">
                            PALING LAKU JUARA
                        </h3>

                        <div className="mt-5">
                            <div className="mt-5">
                                {salesSummary.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                                        <p className="text-lg font-bold text-gray-400">
                                            {activeFilter === "today" &&
                                                "Belum ada penjualan hari ini."}

                                            {activeFilter === "week" &&
                                                "Belum ada penjualan minggu ini."}

                                            {activeFilter === "month" &&
                                                "Belum ada penjualan bulan ini."}
                                        </p>

                                        <p className="mt-2 text-sm text-gray-400">
                                            Data menu yang laku akan muncul di sini.
                                        </p>
                                    </div>
                                ) : (
                                    <LakuCards sales={salesSummary} />
                                )}
                            </div>
                        </div>
                    </motion.div>


                    {/* RECOMMENDATIONS */}
                    <motion.div
                        variants={itemVariants}
                        className="w-2/5"
                    >
                        <h3 className="text-lg font-extrabold text-gray-500">
                            SARAN MENU
                        </h3>

                        <motion.div
                            className="mt-5"
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SaranMenuCards recommendations={reccommendations} />


                        </motion.div>
                        <div className="pt-4"></div>
                        <h3 className="text-lg font-extrabold text-gray-500">Butuh Perhatian</h3>
                        <ButuhPerhatianCards
                            lowStockItems={lowStockItems}
                        />
                        {/* <div className="mt-5 flex flex-col gap-3">
                            {lowStockItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center">
                                    <p className="font-bold text-gray-400">
                                        Semua stok masih aman
                                    </p>
                                </div>
                            ) : (
                                lowStockItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl bg-white p-4 shadow-md"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-800">
                                                    {item.menus.name}
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Stok minimum: {item.minimum_stock}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xl font-extrabold text-red-500">
                                                    {item.stock}
                                                </p>

                                                <p className="text-xs font-bold text-gray-400">
                                                    tersisa
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div> */}

                    </motion.div>

                </motion.section>

            </main>
        </>
    );
}

export default MenuLaku;