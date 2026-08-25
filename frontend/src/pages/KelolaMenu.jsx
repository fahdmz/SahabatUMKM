import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";

function KelolaMenu() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    const [businessId, setBusinessId] = useState(null);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");

    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [error, setError] = useState("");

    async function loadMenus(currentBusinessId) {
        const { data, error: menuError } = await supabase
            .from("menus")
            .select("*")
            .eq("business_id", currentBusinessId)
            .order("is_active", { ascending: false })
            .order("name");

        if (menuError) {
            console.error("GAGAL MENGAMBIL MENU:", menuError);
            return;
        }

        setMenus(data || []);
    }

    useEffect(() => {
        async function init() {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data: businessData } = await supabase
                .from("businesses")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (!businessData) {
                setLoading(false);
                return;
            }

            setBusinessId(businessData.id);
            await loadMenus(businessData.id);
            setLoading(false);
        }

        init();
    }, []);

    function startEdit(menu) {
        setEditingId(menu.id);
        setEditName(menu.name);
        setEditPrice(String(menu.price));
    }

    function cancelEdit() {
        setEditingId(null);
    }

    async function saveEdit(menu) {
        if (!editName.trim() || !editPrice || Number(editPrice) <= 0) {
            setError("Nama dan harga menu harus diisi dengan benar.");
            return;
        }

        setError("");

        const { error: updateError } = await supabase
            .from("menus")
            .update({ name: editName.trim(), price: Number(editPrice) })
            .eq("id", menu.id);

        if (updateError) {
            console.error("GAGAL UPDATE MENU:", updateError);
            setError("Gagal menyimpan perubahan menu.");
            return;
        }

        setMenus((current) =>
            current.map((m) =>
                m.id === menu.id
                    ? { ...m, name: editName.trim(), price: Number(editPrice) }
                    : m
            )
        );
        setEditingId(null);
    }

    async function toggleActive(menu) {
        const { error: toggleError } = await supabase
            .from("menus")
            .update({ is_active: !menu.is_active })
            .eq("id", menu.id);

        if (toggleError) {
            console.error("GAGAL UBAH STATUS MENU:", toggleError);
            alert("Gagal mengubah status menu.");
            return;
        }

        setMenus((current) =>
            current.map((m) =>
                m.id === menu.id ? { ...m, is_active: !m.is_active } : m
            )
        );
    }

    async function handleAddMenu() {
        if (!newName.trim() || !newPrice || Number(newPrice) <= 0) {
            setError("Nama dan harga menu baru harus diisi dengan benar.");
            return;
        }

        setError("");

        const { data, error: insertError } = await supabase
            .from("menus")
            .insert({
                business_id: businessId,
                name: newName.trim(),
                price: Number(newPrice),
            })
            .select()
            .single();

        if (insertError) {
            console.error("GAGAL TAMBAH MENU:", insertError);
            setError("Gagal menambah menu baru.");
            return;
        }

        setMenus((current) => [...current, data]);
        setNewName("");
        setNewPrice("");
    }

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            <NavBar items={navItems} />

            <main className="mx-auto max-w-4xl px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="pt-10"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                                Kelola Menu
                            </h1>
                            <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-gray-400">
                                Tambah, ubah, atau nonaktifkan menu warung Ibu
                            </p>
                        </div>

                        <Link to="/MenuLaku">
                            <Button
                                children="← Kembali"
                                bgColor="bg-white"
                                textColor="text-gray-700"
                                borderColor="border-gray-300"
                                font="font-bold"
                            />
                        </Link>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="mt-10 text-center font-bold text-gray-400">
                        Memuat menu...
                    </div>
                ) : (
                    <>
                        {/* MENU LIST */}
                        <div className="mt-8 flex flex-col gap-3">
                            {menus.map((menu) => (
                                <div
                                    key={menu.id}
                                    className={`rounded-2xl bg-white p-6 shadow-sm ${!menu.is_active ? "opacity-50" : ""
                                        }`}
                                >
                                    {editingId === menu.id ? (
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-[2] rounded-xl bg-gray-50 p-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-200"
                                            />
                                            <input
                                                type="number"
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                className="flex-1 rounded-xl bg-gray-50 p-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-200"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => saveEdit(menu)}
                                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 transition hover:border-black hover:text-black"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-extrabold text-gray-900">
                                                    {menu.name}
                                                    {!menu.is_active && (
                                                        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gray-500">
                                                            Nonaktif
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="mt-1 font-bold text-gray-400">
                                                    Rp{Number(menu.price).toLocaleString("id-ID")}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(menu)}
                                                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-bold text-gray-500 transition hover:border-black hover:text-black"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(menu)}
                                                    className={`rounded-lg border px-4 py-1.5 text-sm font-bold transition ${menu.is_active
                                                        ? "border-red-200 text-red-500 hover:border-red-500 hover:bg-red-50"
                                                        : "border-green-200 text-green-600 hover:border-green-600 hover:bg-green-50"
                                                        }`}
                                                >
                                                    {menu.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {menus.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-8 text-center">
                                    <p className="font-bold text-gray-400">
                                        Belum ada menu. Tambah menu pertama Ibu di bawah.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ADD NEW MENU */}
                        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                                Tambah Menu Baru
                            </p>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="text"
                                    placeholder="Nama menu"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="flex-[2] rounded-xl bg-gray-50 p-4 font-bold text-gray-700 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-green-200"
                                />
                                <input
                                    type="number"
                                    placeholder="Harga"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    className="flex-1 rounded-xl bg-gray-50 p-4 font-bold text-gray-700 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-green-200"
                                />
                                <Button
                                    children="+ Tambah"
                                    bgColor="bg-green-700"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold"
                                    onClick={handleAddMenu}
                                />
                            </div>

                            {error && (
                                <p className="mt-3 text-sm font-bold text-red-500">
                                    {error}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default KelolaMenu;
