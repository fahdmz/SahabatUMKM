import { useEffect, useState } from "react";
import { motion } from "motion/react";
import NavBar from "../components/Navbar";
import FilterButton from "../components/FilterButton";
import TrendChart from "../components/TrendChart";
import { supabase } from "../lib/supabase";

const PERIODS = [
    { label: "7 Hari", days: 7 },
    { label: "14 Hari", days: 14 },
    { label: "30 Hari", days: 30 },
];

function dayKey(dateString) {
    return new Date(dateString).toISOString().split("T")[0];
}

function GrafikBisnis() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    const [periodDays, setPeriodDays] = useState(14);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        async function getTrendData() {
            setLoading(true);

            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) return;

                const { data: businessData } = await supabase
                    .from("businesses")
                    .select("id")
                    .eq("owner_id", user.id)
                    .single();

                if (!businessData) {
                    setChartData([]);
                    return;
                }

                const rangeStart = new Date();
                rangeStart.setHours(0, 0, 0, 0);
                rangeStart.setDate(rangeStart.getDate() - (periodDays - 1));

                const [{ data: salesData }, { data: expensesData }] = await Promise.all([
                    supabase
                        .from("sales")
                        .select("total_price, sold_at")
                        .eq("business_id", businessData.id)
                        .is("deleted_at", null)
                        .gte("sold_at", rangeStart.toISOString()),
                    supabase
                        .from("expenses")
                        .select("amount, spent_at")
                        .eq("business_id", businessData.id)
                        .is("deleted_at", null)
                        .gte("spent_at", rangeStart.toISOString()),
                ]);

                const incomeByDay = {};
                (salesData || []).forEach((sale) => {
                    const key = dayKey(sale.sold_at);
                    incomeByDay[key] = (incomeByDay[key] || 0) + Number(sale.total_price);
                });

                const expenseByDay = {};
                (expensesData || []).forEach((expense) => {
                    const key = dayKey(expense.spent_at);
                    expenseByDay[key] =
                        (expenseByDay[key] || 0) + Number(expense.amount);
                });

                const days = [];
                for (let i = 0; i < periodDays; i++) {
                    const date = new Date(rangeStart);
                    date.setDate(date.getDate() + i);
                    const key = date.toISOString().split("T")[0];

                    const income = incomeByDay[key] || 0;
                    const expense = expenseByDay[key] || 0;

                    days.push({
                        key,
                        label: date.toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                        }),
                        income,
                        expense,
                        profit: income - expense,
                    });
                }

                setChartData(days);
            } catch (error) {
                console.error("GRAFIK QUERY CRASHED:", error);
            } finally {
                setLoading(false);
            }
        }

        getTrendData();
    }, [periodDays]);

    const totals = chartData.reduce(
        (acc, d) => ({
            income: acc.income + d.income,
            expense: acc.expense + d.expense,
            profit: acc.profit + d.profit,
        }),
        { income: 0, expense: 0, profit: 0 }
    );

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            <NavBar items={navItems} />

            <main className="mx-auto max-w-5xl px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="pt-10"
                >
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Grafik Bisnis
                    </h1>

                    <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gray-400">
                        Tren pemasukan, pengeluaran, dan untung warung Ibu
                    </p>
                </motion.div>

                {/* FILTER ROW */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-6 flex gap-2 rounded-xl bg-white p-1 w-fit"
                >
                    {PERIODS.map((p) => (
                        <FilterButton
                            key={p.days}
                            label={p.label}
                            selected={periodDays === p.days}
                            onClick={() => setPeriodDays(p.days)}
                        />
                    ))}
                </motion.div>

                {/* STAT TILES */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="mt-6 grid grid-cols-3 gap-5"
                >
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
                            Total Pemasukan
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-green-600">
                            Rp{totals.income.toLocaleString("id-ID")}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
                            Total Pengeluaran
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-orange-600">
                            Rp{totals.expense.toLocaleString("id-ID")}
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
                            Total Untung
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-blue-600">
                            Rp{totals.profit.toLocaleString("id-ID")}
                        </p>
                    </div>
                </motion.div>

                {/* CHART */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 rounded-3xl bg-white p-8 shadow-sm"
                >
                    {loading ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <p className="text-sm font-bold text-gray-400">
                                Lagi ambil data grafik...
                            </p>
                        </div>
                    ) : (
                        <TrendChart data={chartData} />
                    )}
                </motion.div>
            </main>
        </div>
    );
}

export default GrafikBisnis;
