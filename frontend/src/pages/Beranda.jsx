import { motion } from "motion/react";
import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

function Beranda() {
    const [business, setBusiness] = useState(null);
    const [menus, setMenus] = useState([]);

    const [totalMasuk, setTotalMasuk] = useState(0);
    const [totalBelanja, setTotalBelanja] = useState(0);
    const [growthPercent, setGrowthPercent] = useState(0);
    const [topMenuToday, setTopMenuToday] = useState(null);
    const [urgentLowStock, setUrgentLowStock] = useState(null);

    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/Rapor" },
    ];

    useEffect(() => {
        async function getBusinessAndMenus() {
            console.log("=== GET BUSINESS ===");

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

            console.log("USER ID:", user.id);

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
                    console.error("GAGAL MENGAMBIL BUSINESS:", businessError);
                    return;
                }

                if (businessData.length === 0) {
                    console.log("USER BELUM MEMILIKI BUSINESS");
                    return;
                }

                const currentBusiness = businessData[0];

                setBusiness(currentBusiness);

                console.log("CURRENT BUSINESS:", currentBusiness);

                // =========================
                // GET MENUS
                // =========================
                const {
                    data: menuData,
                    error: menuError
                } = await supabase
                    .from("menus")
                    .select("*")
                    .eq("business_id", currentBusiness.id)
                    .eq("is_active", true);

                console.log("MENUS:", menuData);
                console.log("MENU ERROR:", menuError);

                if (menuError) {
                    console.error("GAGAL MENGAMBIL MENU:", menuError);
                    return;
                }

                setMenus(menuData);

                // =========================
                // DATE BOUNDARIES
                // =========================
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const yesterdayStart = new Date(todayStart);
                yesterdayStart.setDate(yesterdayStart.getDate() - 1);

                const yesterdayEnd = new Date(todayStart);
                yesterdayEnd.setMilliseconds(-1);

                // =========================
                // GET SALES (today + yesterday, filtered locally)
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
                    .eq("business_id", currentBusiness.id)
                    .gte("sold_at", yesterdayStart.toISOString());

                console.log("SALES (today+yesterday):", salesData);
                console.log("SALES ERROR:", salesError);

                if (salesError) {
                    console.error("GAGAL MENGAMBIL SALES:", salesError);
                    return;
                }

                const todaySales = (salesData || []).filter(
                    (sale) => new Date(sale.sold_at) >= todayStart
                );

                const yesterdaySales = (salesData || []).filter((sale) => {
                    const soldAt = new Date(sale.sold_at);
                    return soldAt >= yesterdayStart && soldAt <= yesterdayEnd;
                });

                const todayTotal = todaySales.reduce(
                    (sum, sale) => sum + sale.total_price,
                    0
                );

                const yesterdayTotal = yesterdaySales.reduce(
                    (sum, sale) => sum + sale.total_price,
                    0
                );

                setTotalMasuk(todayTotal);

                if (yesterdayTotal === 0) {
                    setGrowthPercent(todayTotal > 0 ? 100 : 0);
                } else {
                    const percent =
                        ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
                    setGrowthPercent(Math.round(percent));
                }

                // Top menu today by portions sold
                const menuTotals = {};

                todaySales.forEach((sale) => {
                    const menuId = sale.menu_id;

                    if (!menuTotals[menuId]) {
                        menuTotals[menuId] = {
                            name: sale.menus.name,
                            total_porsi: 0,
                        };
                    }

                    menuTotals[menuId].total_porsi += sale.quantity;
                });

                const sortedMenus = Object.values(menuTotals).sort(
                    (a, b) => b.total_porsi - a.total_porsi
                );

                setTopMenuToday(sortedMenus[0] || null);

                // =========================
                // GET EXPENSES (today)
                // =========================
                const {
                    data: expensesData,
                    error: expensesError
                } = await supabase
                    .from("expenses")
                    .select("amount, spent_at")
                    .eq("business_id", currentBusiness.id)
                    .gte("spent_at", todayStart.toISOString());

                console.log("EXPENSES (today):", expensesData);
                console.log("EXPENSES ERROR:", expensesError);

                if (expensesError) {
                    console.error("GAGAL MENGAMBIL EXPENSES:", expensesError);
                } else {
                    const expensesTotal = (expensesData || []).reduce(
                        (sum, expense) => sum + expense.amount,
                        0
                    );

                    setTotalBelanja(expensesTotal);
                }

                // =========================
                // GET LOW STOCK (for tomorrow's suggestion)
                // =========================
                const {
                    data: inventoryData,
                    error: inventoryError
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
                    .eq("business_id", currentBusiness.id);

                console.log("INVENTORY:", inventoryData);
                console.log("INVENTORY ERROR:", inventoryError);

                if (inventoryError) {
                    console.error("GAGAL MENGAMBIL INVENTORY:", inventoryError);
                } else {
                    const attentionItems = (inventoryData || [])
                        .filter((item) => item.stock <= item.minimum_stock)
                        .sort(
                            (a, b) =>
                                (a.stock - a.minimum_stock) -
                                (b.stock - b.minimum_stock)
                        );

                    setUrgentLowStock(attentionItems[0] || null);
                }

            } catch (error) {
                console.error("QUERY CRASHED:", error);
            }
        }

        getBusinessAndMenus();
    }, []);

    const untung = totalMasuk - totalBelanja;

    return (
        <>
            {/* NAVBAR */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.5,
                    ease: "easeOut",
                }}
            >
                <NavBar items={navItems} />
            </motion.div>

            <div className="px-150">

                {/* GREETING */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.15,
                        ease: "easeOut",
                    }}
                    className="py-10 text-4xl font-bold"
                >
                    Hello, Bu Sari
                </motion.div>


                {/* MAIN CARDS */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.15,
                            },
                        },
                    }}
                    className="flex items-stretch gap-10"
                >

                    {/* PROFIT CARD */}
                    <motion.div
                        variants={{
                            hidden: {
                                opacity: 0,
                                x: -40,
                            },
                            visible: {
                                opacity: 1,
                                x: 0,
                            },
                        }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                        }}
                        whileHover={{
                            y: -4,
                        }}
                        className="flex flex-[5] flex-col rounded-4xl bg-green-700 px-12 pt-12"
                    >
                        <div className="text-xl font-extrabold text-gray-300">
                            Untung Hari Ini
                        </div>

                        <div className="py-2"></div>

                        <div className="pb-8">
                            <div className="text-5xl font-extrabold text-white">
                                RP{untung.toLocaleString("id-ID")}
                            </div>
                        </div>

                        <div className="border-t border-white"></div>

                        <div className="flex gap-6 pt-4">

                            <div className="flex-1 rounded-lg px-4 pt-4">
                                <div className="text-lg text-white">
                                    Total Masuk
                                </div>

                                <div className="text-4xl font-bold text-white">
                                    RP{totalMasuk.toLocaleString("id-ID")}
                                </div>
                            </div>

                            <div className="flex-1 rounded-l px-4 pt-4">
                                <div className="text-lg text-white">
                                    Total Belanja
                                </div>

                                <div className="text-4xl font-bold text-white">
                                    RP{totalBelanja.toLocaleString("id-ID")}
                                </div>
                            </div>

                        </div>
                    </motion.div>


                    {/* BUSINESS SUMMARY */}
                    <motion.div
                        variants={{
                            hidden: {
                                opacity: 0,
                                x: 40,
                            },
                            visible: {
                                opacity: 1,
                                x: 0,
                            },
                        }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                        }}
                        whileHover={{
                            y: -4,
                        }}
                        className="flex flex-[2] flex-col rounded-4xl bg-white px-5 py-5 shadow-xl"
                    >
                        <div className="text-lg font-extrabold text-gray-400">
                            Ringkasan Bisnis Hari ini
                        </div>

                        <div className="text-2xl font-extrabold text-black">
                            {growthPercent > 0 && "Hari ini Jualan Ibu Naik!"}
                            {growthPercent < 0 && "Hari ini Jualan Ibu Turun"}
                            {growthPercent === 0 && "Jualan Hari Ini Stabil"}
                        </div>

                        <div className="text-4xl text-green-800">
                            {growthPercent > 0 ? "+" : ""}
                            {growthPercent}%
                        </div>

                        <div className="pt-10">
                            <div className="text-xl text-gray-600">
                                {topMenuToday ? (
                                    <>
                                        {topMenuToday.name} paling juara, sudah
                                        laku {topMenuToday.total_porsi} porsi
                                        sampai sekarang.
                                    </>
                                ) : (
                                    "Belum ada penjualan hari ini."
                                )}
                            </div>
                        </div>
                        <a
                            href="/lmao"
                            className="pt-12 text-center text-xs text-black transition-colors hover:text-green-700"
                        >
                            LIHAT ANALISIS MENU
                        </a>
                    </motion.div>

                </motion.div>


                <div className="py-8"></div>


                {/* BOTTOM SECTION */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                delayChildren: 0.5,
                                staggerChildren: 0.15,
                            },
                        },
                    }}
                    className="flex justify-between gap-4"
                >

                    {/* LEFT BOTTOM CARD */}
                    <motion.div
                        variants={{
                            hidden: {
                                opacity: 0,
                                y: 30,
                            },
                            visible: {
                                opacity: 1,
                                y: 0,
                            },
                        }}
                        transition={{
                            duration: 0.5,
                        }}
                        whileHover={{
                            y: -3,
                        }}
                        className="flex flex-1 justify-center rounded-3xl bg-white py-8 shadow-2xl"
                    >
                        Nanti Di isi!
                    </motion.div>


                    {/* RIGHT COLUMN */}
                    <motion.div
                        variants={{
                            hidden: {
                                opacity: 0,
                                y: 30,
                            },
                            visible: {
                                opacity: 1,
                                y: 0,
                            },
                        }}
                        transition={{
                            duration: 0.5,
                        }}
                        className="flex flex-1 flex-col"
                    >

                        {/* ADVICE */}
                        <motion.div
                            whileHover={{
                                y: -3,
                            }}
                            className="flex flex-1 flex-col rounded-2xl border border-red-200 bg-orange-100 px-8 py-8 font-extrabold text-red-800 shadow-2xl"
                        >
                            SARAN BUAT BESOK

                            <div className="py-4"></div>

                            <div className="text-xl font-bold">
                                {urgentLowStock ? (
                                    <>
                                        Stok {urgentLowStock.menus.name} tinggal
                                        sedikit lagi (tersisa{" "}
                                        {urgentLowStock.stock}). Jangan lupa
                                        belanja pagi besok biar nggak kehabisan
                                        pas jam makan siang.
                                    </>
                                ) : (
                                    "Semua stok masih aman, belum ada yang perlu dibeli besok."
                                )}
                            </div>

                            <div className="py-8"></div>

                            <Link to="/Beranda/CatatBelanja">
                                <Button
                                    bgColor="bg-white"
                                    textColor="black"
                                >
                                    Catat Belanja Sekarang
                                </Button>
                            </Link>

                        </motion.div>


                        <div className="py-4"></div>


                        {/* REPORT */}
                        <motion.div
                            whileHover={{
                                y: -3,
                            }}
                            className="flex flex-col justify-center gap-2 rounded-2xl bg-white p-8 text-2xl font-bold shadow-2xl"
                        >
                            Tombol Laporan

                            <div className="text-xs text-gray-300">
                                Klik Buat Kirim Otomatis
                            </div>
                        </motion.div>

                    </motion.div>

                </motion.div>

            </div >
        </>
    );
}

export default Beranda;