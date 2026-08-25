import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import NotificationCard from "../components/NotificationCard";

function MulaiCatat() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    const [saved, setSaved] = useState(false);
    const [menus, setMenus] = useState([]);
    const [selectedMenus, setSelectedMenus] = useState([]);
    const [otherAmount, setOtherAmount] = useState("");
    const [note, setNote] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const amount = 5000;


    if (saved) {
        return (
            <NotificationCard
                title="Cuan Tercatat!"
                message="Uang masuk sebesar"
                highlight={`Rp${amount.toLocaleString("id-ID")} sudah diamankan di pembukuan.`}
            />
        )
    }

    // =========================================================
    // GET MENUS
    // =========================================================

    useEffect(() => {
        async function getMenus() {
            try {
                setLoading(true);

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("USER ERROR:", userError);
                    return;
                }

                const {
                    data: businessData,
                    error: businessError,
                } = await supabase
                    .from("businesses")
                    .select("id")
                    .eq("owner_id", user.id)
                    .single();

                if (businessError) {
                    console.error("BUSINESS ERROR:", businessError);
                    return;
                }

                const {
                    data: menuData,
                    error: menuError,
                } = await supabase
                    .from("menus")
                    .select(`
                        id,
                        name,
                        price
                    `)
                    .eq("business_id", businessData.id)
                    .order("name");

                if (menuError) {
                    console.error("MENU ERROR:", menuError);
                    return;
                }

                setMenus(menuData || []);
            } catch (error) {
                console.error("GET MENUS CRASHED:", error);
            } finally {
                setLoading(false);
            }
        }

        getMenus();
    }, []);

    // =========================================================
    // ADD MENU
    // =========================================================

    function addMenu(menu) {
        setSelectedMenus((current) => {
            const existingMenu = current.find(
                (item) => item.id === menu.id
            );

            // Kalau sudah ada → tambah quantity
            if (existingMenu) {
                return current.map((item) =>
                    item.id === menu.id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                        }
                        : item
                );
            }

            // Kalau belum ada → buat item baru
            return [
                ...current,
                {
                    id: menu.id,
                    name: menu.name,
                    price: Number(menu.price),
                    quantity: 1,
                },
            ];
        });
    }

    // =========================================================
    // REMOVE MENU
    // =========================================================

    function removeMenu(menuId) {
        setSelectedMenus((current) => {
            const existingMenu = current.find(
                (item) => item.id === menuId
            );

            if (!existingMenu) {
                return current;
            }

            // Kalau quantity masih > 1 → kurangi
            if (existingMenu.quantity > 1) {
                return current.map((item) =>
                    item.id === menuId
                        ? {
                            ...item,
                            quantity: item.quantity - 1,
                        }
                        : item
                );
            }

            // Kalau quantity = 1 → hapus dari rincian
            return current.filter(
                (item) => item.id !== menuId
            );
        });
    }

    // =========================================================
    // KEYPAD
    // =========================================================

    const keypadButtons = [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "000",
        "0",
        "backspace",
    ];

    function handleNumberClick(value) {
        setOtherAmount((current) => {
            if (current === "0") {
                return value;
            }

            return current + value;
        });
    }

    function handleBackspace() {
        setOtherAmount((current) => {
            return current.slice(0, -1);
        });
    }

    // =========================================================
    // TOTAL
    // =========================================================

    const menuTotal = useMemo(() => {
        return selectedMenus.reduce(
            (total, item) => {
                return total + item.price * item.quantity;
            },
            0
        );
    }, [selectedMenus]);

    const otherTotal = Number(otherAmount || 0);

    const grandTotal = menuTotal + otherTotal;

    const hasTransaction =
        selectedMenus.length > 0 || otherTotal > 0;

    // =========================================================
    // RUPIAH
    // =========================================================

    function formatRupiah(value) {
        return (
            "Rp" +
            Number(value || 0).toLocaleString("id-ID")
        );
    }

    // =========================================================
    // SAVE
    // =========================================================

    async function handleSave() {
        if (!hasTransaction || saving) {
            return;
        }

        try {
            setSaving(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("User belum login.");
            }

            const {
                data: businessData,
                error: businessError,
            } = await supabase
                .from("businesses")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (businessError) {
                throw businessError;
            }

            const businessId = businessData.id;

            // =================================================
            // SAVE SALES
            // =================================================

            if (selectedMenus.length > 0) {
                const salesRows = selectedMenus.map((item) => ({
                    business_id: businessId,
                    menu_id: item.id,
                    quantity: item.quantity,
                    total_price:
                        item.price * item.quantity,
                    sold_at: new Date().toISOString(),
                }));

                const {
                    error: salesError,
                } = await supabase
                    .from("sales")
                    .insert(salesRows);

                if (salesError) {
                    throw salesError;
                }
            }

            // =================================================
            // SAVE OTHER CASH
            // =================================================

            if (otherTotal > 0) {
                const {
                    error: cashError,
                } = await supabase
                    .from("cash_entries")
                    .insert({
                        business_id: businessId,
                        amount: otherTotal,
                    });

                if (cashError) {
                    throw cashError;
                }
            }

            // Reset
            setSelectedMenus([]);
            setOtherAmount("");
            setNote("");

            alert("Cuan berhasil disimpan!");
        } catch (error) {
            console.error(
                "SAVE TRANSACTION ERROR:",
                error
            );

            alert("Gagal menyimpan transaksi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <NavBar items={navItems} />

            <main className="min-h-screen bg-[#f7f5ef] px-6 py-10">

                <div className="mx-auto max-w-6xl">

                    {/* =================================================
                        MAIN CONTAINER
                    ================================================= */}

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
                            duration: 0.35,
                        }}
                        className="
                            overflow-hidden
                            rounded-[40px]
                            bg-white
                            shadow-2xl
                        "
                    >

                        {/* =================================================
                            HEADER
                        ================================================= */}

                        <div className="
                            flex
                            items-center
                            justify-between
                            border-b
                            border-gray-100
                            px-10
                            py-7
                        ">

                            <div className="flex items-center gap-5">

                                {/* Icon */}
                                <div className="
                                    flex
                                    h-16
                                    w-16
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-green-50
                                    text-4xl
                                    font-bold
                                    text-green-600
                                ">
                                    ↗
                                </div>

                                <div>
                                    <h1 className="
                                        text-3xl
                                        font-extrabold
                                        text-gray-900
                                    ">
                                        Catat Uang Jualan
                                    </h1>

                                    <p className="
                                        text-base
                                        font-semibold
                                        text-gray-400
                                    ">
                                        Pilih menu yang laku atau ketik jumlah uangnya, Bu.
                                    </p>
                                </div>

                            </div>

                            {/* CLOSE BUTTON */}

                            <Link to="/Beranda">
                                <motion.button
                                    whileTap={{
                                        scale: 0.9,
                                    }}
                                    className="
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-gray-100
                                        text-3xl
                                        font-light
                                        text-gray-500
                                        transition
                                        hover:bg-gray-200
                                    "
                                >
                                    ×
                                </motion.button>
                            </Link>

                        </div>

                        {/* =================================================
                            TWO COLUMNS
                        ================================================= */}

                        <div className="grid grid-cols-2">

                            {/* =================================================
                                LEFT SIDE
                            ================================================= */}

                            <div className="
                                border-r
                                border-gray-100
                                p-10
                            ">

                                {/* MENU TITLE */}

                                <h2 className="
                                    mb-8
                                    text-lg
                                    font-extrabold
                                    tracking-widest
                                    text-gray-400
                                ">
                                    PILIH MENU LARIS
                                </h2>

                                {/* =================================================
                                    MENU CARDS
                                ================================================= */}

                                {loading ? (
                                    <div className="
                                        py-20
                                        text-center
                                        font-semibold
                                        text-gray-400
                                    ">
                                        Memuat menu...
                                    </div>
                                ) : (
                                    <div className="
                                        grid
                                        grid-cols-2
                                        gap-5
                                    ">

                                        {menus.map((menu) => {

                                            const selectedMenu =
                                                selectedMenus.find(
                                                    (item) =>
                                                        item.id ===
                                                        menu.id
                                                );

                                            return (
                                                <div
                                                    key={menu.id}
                                                    className="
                                                        flex
                                                        min-h-52
                                                        flex-col
                                                        justify-between
                                                        rounded-3xl
                                                        bg-white
                                                        p-7
                                                        shadow-sm
                                                        ring-1
                                                        ring-gray-100
                                                    "
                                                >

                                                    {/* MENU NAME */}

                                                    <div className="
                                                        max-w-[190px]
                                                        text-xl
                                                        font-extrabold
                                                        leading-tight
                                                        text-gray-900
                                                    ">
                                                        {menu.name}
                                                    </div>

                                                    {/* PRICE + PLUS */}

                                                    <div className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-3
                                                    ">

                                                        <span className="
                                                            text-2xl
                                                            font-extrabold
                                                            text-gray-500
                                                        ">
                                                            {formatRupiah(
                                                                menu.price
                                                            )}
                                                        </span>

                                                        {/* ACTUAL PLUS BUTTON */}

                                                        <motion.button
                                                            whileTap={{
                                                                scale: 0.88,
                                                            }}
                                                            onClick={() =>
                                                                addMenu(menu)
                                                            }
                                                            className="
                                                                relative
                                                                flex
                                                                h-14
                                                                w-14
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-2xl
                                                                bg-green-50
                                                                text-3xl
                                                                font-light
                                                                text-green-600
                                                                transition
                                                                hover:bg-green-100
                                                            "
                                                        >
                                                            +

                                                            {/* QUANTITY BADGE */}

                                                            {selectedMenu && (
                                                                <span className="
                                                                    absolute
                                                                    -right-2
                                                                    -top-2
                                                                    flex
                                                                    h-7
                                                                    min-w-7
                                                                    items-center
                                                                    justify-center
                                                                    rounded-full
                                                                    bg-green-600
                                                                    px-2
                                                                    text-xs
                                                                    font-extrabold
                                                                    text-white
                                                                ">
                                                                    {
                                                                        selectedMenu.quantity
                                                                    }
                                                                </span>
                                                            )}
                                                        </motion.button>

                                                    </div>

                                                </div>
                                            );
                                        })}

                                    </div>
                                )}

                                {/* =================================================
                                    KEYPAD
                                ================================================= */}

                                <div className="
                                    mt-10
                                    border-t
                                    border-gray-200
                                    pt-8
                                ">

                                    <h2 className="
                                        mb-6
                                        text-lg
                                        font-extrabold
                                        tracking-widest
                                        text-gray-400
                                    ">
                                        KETIK UANG LAINNYA (TIPS/UTANG)
                                    </h2>

                                    <div className="
                                        grid
                                        grid-cols-3
                                        gap-4
                                    ">

                                        {keypadButtons.map(
                                            (button) => {

                                                const isBackspace =
                                                    button ===
                                                    "backspace";

                                                return (
                                                    <motion.button
                                                        key={button}
                                                        whileTap={{
                                                            scale: 0.95,
                                                        }}
                                                        onClick={() => {
                                                            if (
                                                                isBackspace
                                                            ) {
                                                                handleBackspace();
                                                            } else {
                                                                handleNumberClick(
                                                                    button
                                                                );
                                                            }
                                                        }}
                                                        className={`
                                                            flex
                                                            h-20
                                                            items-center
                                                            justify-center
                                                            rounded-2xl
                                                            text-2xl
                                                            font-extrabold
                                                            shadow-sm
                                                            transition
                                                            ${isBackspace
                                                                ? "bg-red-50 text-red-500 ring-1 ring-red-100 hover:bg-red-100"
                                                                : "bg-white text-gray-900 ring-1 ring-gray-100 hover:bg-gray-50"
                                                            }
                                                        `}
                                                    >
                                                        {isBackspace
                                                            ? "←"
                                                            : button}
                                                    </motion.button>
                                                );
                                            }
                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                                RIGHT SIDE
                            ================================================= */}

                            <div className="
                                flex
                                min-h-[850px]
                                flex-col
                                p-10
                            ">

                                {/* TITLE */}

                                <h2 className="
                                    text-lg
                                    font-extrabold
                                    tracking-widest
                                    text-gray-400
                                ">
                                    RINCIAN UANG MASUK
                                </h2>

                                {/* =================================================
                                    SELECTED MENU LIST
                                ================================================= */}

                                <div className="
                                    mt-8
                                    flex-1
                                ">

                                    {selectedMenus.length === 0 ? (
                                        <div className="
                                            flex
                                            h-56
                                            items-center
                                            justify-center
                                        ">
                                            <p className="
                                                text-xl
                                                font-bold
                                                italic
                                                text-gray-300
                                            ">
                                                Belum ada yang dipilih...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="
                                            flex
                                            flex-col
                                            gap-4
                                        ">

                                            {selectedMenus.map(
                                                (item) => (
                                                    <motion.div
                                                        layout
                                                        key={item.id}
                                                        className="
                                                            flex
                                                            items-center
                                                            justify-between
                                                            rounded-2xl
                                                            bg-gray-50
                                                            px-5
                                                            py-4
                                                        "
                                                    >

                                                        <div>
                                                            <p className="
                                                                text-base
                                                                font-extrabold
                                                                text-gray-900
                                                            ">
                                                                {item.name}
                                                            </p>

                                                            <p className="
                                                                mt-1
                                                                text-sm
                                                                font-bold
                                                                text-gray-400
                                                            ">
                                                                {formatRupiah(
                                                                    item.price
                                                                )}{" "}
                                                                ×{" "}
                                                                {item.quantity}
                                                            </p>
                                                        </div>

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-4
                                                        ">

                                                            <p className="
                                                                text-lg
                                                                font-extrabold
                                                                text-green-600
                                                            ">
                                                                {formatRupiah(
                                                                    item.price *
                                                                    item.quantity
                                                                )}
                                                            </p>

                                                            {/* MINUS BUTTON */}

                                                            <motion.button
                                                                whileTap={{
                                                                    scale: 0.9,
                                                                }}
                                                                onClick={() =>
                                                                    removeMenu(
                                                                        item.id
                                                                    )
                                                                }
                                                                className="
                                                                    flex
                                                                    h-9
                                                                    w-9
                                                                    items-center
                                                                    justify-center
                                                                    rounded-full
                                                                    bg-gray-200
                                                                    text-lg
                                                                    font-bold
                                                                    text-gray-500
                                                                    transition
                                                                    hover:bg-red-50
                                                                    hover:text-red-500
                                                                "
                                                            >
                                                                −
                                                            </motion.button>

                                                        </div>

                                                    </motion.div>
                                                )
                                            )}

                                        </div>
                                    )}

                                </div>

                                {/* =================================================
                                    NOTE
                                ================================================= */}

                                <div className="mt-8">

                                    <h2 className="
                                        mb-5
                                        text-lg
                                        font-extrabold
                                        tracking-widest
                                        text-gray-400
                                    ">
                                        CATATAN (BOLEH KOSONG)
                                    </h2>

                                    <textarea
                                        value={note}
                                        onChange={(e) =>
                                            setNote(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Contoh: Pesanan Pak Budi, Kembalian..."
                                        className="
                                            h-32
                                            w-full
                                            resize-none
                                            rounded-2xl
                                            bg-gray-50
                                            p-5
                                            text-base
                                            font-semibold
                                            text-gray-700
                                            outline-none
                                            placeholder:text-gray-400
                                            focus:ring-2
                                            focus:ring-green-100
                                        "
                                    />

                                </div>

                                {/* =================================================
                                    TOTAL
                                ================================================= */}

                                <div className="
                                    mt-8
                                    border-t
                                    border-gray-100
                                    pt-7
                                ">

                                    <div className="
                                        flex
                                        items-center
                                        justify-between
                                    ">

                                        <span className="
                                            text-xl
                                            font-extrabold
                                            text-gray-400
                                        ">
                                            Total Uang
                                        </span>

                                        <span className="
                                            text-4xl
                                            font-extrabold
                                            text-green-600
                                        ">
                                            {formatRupiah(
                                                grandTotal
                                            )}
                                        </span>

                                    </div>

                                    {/* =================================================
                                        SAVE BUTTON
                                    ================================================= */}

                                    <motion.button
                                        whileTap={
                                            hasTransaction
                                                ? {
                                                    scale: 0.98,
                                                }
                                                : {}
                                        }
                                        disabled={
                                            !hasTransaction ||
                                            saving
                                        }
                                        onClick={handleSave}
                                        className={`
                                            mt-7
                                            w-full
                                            rounded-2xl
                                            py-6
                                            text-2xl
                                            font-extrabold
                                            transition
                                            ${hasTransaction
                                                ? "bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700"
                                                : "cursor-not-allowed bg-gray-300 text-white"
                                            }
                                        `}
                                    >
                                        {saving
                                            ? "MENYIMPAN..."
                                            : hasTransaction
                                                ? "SIMPAN CUAN"
                                                : "PILIH MENU DULU"}
                                    </motion.button>

                                </div>

                            </div>

                        </div>

                    </motion.div>

                </div>

            </main>
        </>
    );
}

export default MulaiCatat;