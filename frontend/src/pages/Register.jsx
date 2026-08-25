import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import InputTextTemplate from "../components/InputTextTemplate";
import Button from "../components/Button";

const STEP_LABELS = {
    account: "Langkah 1 dari 3 — Buat Akun",
    confirmEmail: "Cek Email Kamu",
    business: "Langkah 2 dari 3 — Nama Warung",
    menu: "Langkah 3 dari 3 — Menu Warung",
};

function Register() {
    const navigate = useNavigate();

    const [step, setStep] = useState("account");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [businessName, setBusinessName] = useState("");
    const [businessId, setBusinessId] = useState(null);

    const [menuItems, setMenuItems] = useState([{ name: "", price: "" }]);

    async function handleSignUp() {
        setError("");
        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // Project may require email confirmation before a session exists.
        // Without a session, auth.uid() is null and RLS blocks the business
        // insert below, so the flow has to pause here instead of continuing.
        if (!data.session) {
            setStep("confirmEmail");
            setLoading(false);
            return;
        }

        setStep("business");
        setLoading(false);
    }

    async function handleCreateBusiness() {
        if (!businessName.trim()) {
            setError("Nama warung tidak boleh kosong.");
            return;
        }

        setError("");
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data, error: businessError } = await supabase
            .from("businesses")
            .insert({ name: businessName.trim(), owner_id: user.id })
            .select()
            .single();

        if (businessError) {
            console.error("GAGAL BUAT BISNIS:", businessError);
            setError("Gagal menyimpan nama warung. Coba lagi.");
            setLoading(false);
            return;
        }

        setBusinessId(data.id);
        setStep("menu");
        setLoading(false);
    }

    function updateMenuItem(index, field, value) {
        setMenuItems((current) =>
            current.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    }

    function addMenuItemRow() {
        setMenuItems((current) => [...current, { name: "", price: "" }]);
    }

    function removeMenuItemRow(index) {
        setMenuItems((current) => current.filter((_, i) => i !== index));
    }

    async function handleSaveMenu() {
        setError("");

        const filledItems = menuItems.filter((item) => item.name.trim().length > 0);

        if (filledItems.length === 0) {
            setError("Isi minimal satu menu, atau lewati dulu.");
            return;
        }

        const invalidItem = filledItems.find(
            (item) => !item.price || Number(item.price) <= 0
        );

        if (invalidItem) {
            setError(`Harga untuk "${invalidItem.name}" harus diisi dan lebih dari 0.`);
            return;
        }

        setLoading(true);

        const rows = filledItems.map((item) => ({
            business_id: businessId,
            name: item.name.trim(),
            price: Number(item.price),
        }));

        const { error: menuError } = await supabase.from("menus").insert(rows);

        if (menuError) {
            console.error("GAGAL SIMPAN MENU:", menuError);
            setError("Gagal menyimpan menu. Coba lagi.");
            setLoading(false);
            return;
        }

        navigate("/Beranda");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb] px-6 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg rounded-[40px] bg-white p-10 shadow-2xl md:p-12"
            >
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-green-700">
                    {STEP_LABELS[step]}
                </p>

                <AnimatePresence mode="wait">
                    {step === "account" && (
                        <motion.div
                            key="account"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <h1 className="text-3xl font-extrabold text-gray-900">
                                Buat Akun Warung
                            </h1>

                            <p className="mt-2 font-bold text-gray-400">
                                Sebentar lagi Ibu bisa mulai catat jualan.
                            </p>

                            <div className="mt-8">
                                <InputTextTemplate
                                    lable="EMAIL"
                                    type="email"
                                    placeholder="emailanda@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="mt-6">
                                <InputTextTemplate
                                    lable="KATA SANDI"
                                    type="password"
                                    placeholder="Minimal 6 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {error && (
                                <p className="mt-3 text-sm font-bold text-red-500">
                                    {error}
                                </p>
                            )}

                            <div className="mt-8">
                                <Button
                                    children={loading ? "Memuat..." : "Buat Akun"}
                                    bgColor="bg-green-700"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold w-full"
                                    onClick={handleSignUp}
                                />
                            </div>

                            <p className="mt-6 text-center text-sm font-bold text-gray-400">
                                Sudah punya akun?{" "}
                                <Link to="/Login" className="text-green-700">
                                    Masuk di sini
                                </Link>
                            </p>
                        </motion.div>
                    )}

                    {step === "confirmEmail" && (
                        <motion.div
                            key="confirmEmail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <h1 className="text-3xl font-extrabold text-gray-900">
                                Cek Email Kamu
                            </h1>

                            <p className="mt-3 font-bold text-gray-400">
                                Kami sudah kirim link konfirmasi ke {email}. Buka email itu dulu, baru login ya, Bu.
                            </p>

                            <div className="mt-8">
                                <Link to="/Login">
                                    <Button
                                        children="Ke Halaman Login"
                                        bgColor="bg-green-700"
                                        textColor="text-white"
                                        border={false}
                                        font="font-extrabold w-full"
                                    />
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {step === "business" && (
                        <motion.div
                            key="business"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <h1 className="text-3xl font-extrabold text-gray-900">
                                Warung Ibu Namanya Apa?
                            </h1>

                            <p className="mt-2 font-bold text-gray-400">
                                Nama ini yang bakal muncul di rapor bisnis Ibu.
                            </p>

                            <div className="mt-8">
                                <InputTextTemplate
                                    lable="NAMA WARUNG"
                                    type="text"
                                    placeholder="Warung Bu Sari"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                />
                            </div>

                            {error && (
                                <p className="mt-3 text-sm font-bold text-red-500">
                                    {error}
                                </p>
                            )}

                            <div className="mt-8">
                                <Button
                                    children={loading ? "Memuat..." : "Lanjut"}
                                    bgColor="bg-green-700"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold w-full"
                                    onClick={handleCreateBusiness}
                                />
                            </div>
                        </motion.div>
                    )}

                    {step === "menu" && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <h1 className="text-3xl font-extrabold text-gray-900">
                                Menu Apa Aja yang Dijual?
                            </h1>

                            <p className="mt-2 font-bold text-gray-400">
                                Isi nama menu sama harganya, satu per baris.
                            </p>

                            <div className="mt-6 flex flex-col gap-3">
                                {menuItems.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="flex-[2]">
                                            <input
                                                type="text"
                                                placeholder="Nama menu (contoh: Ricebowl Ayam)"
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateMenuItem(index, "name", e.target.value)
                                                }
                                                className="w-full rounded-xl bg-gray-50 p-4 font-bold text-gray-700 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-green-200"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Harga"
                                                value={item.price}
                                                onChange={(e) =>
                                                    updateMenuItem(index, "price", e.target.value)
                                                }
                                                className="w-full rounded-xl bg-gray-50 p-4 font-bold text-gray-700 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-green-200"
                                            />
                                        </div>

                                        {menuItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMenuItemRow(index)}
                                                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addMenuItemRow}
                                className="mt-4 text-sm font-bold text-green-700 transition hover:text-green-800"
                            >
                                + Tambah Menu
                            </button>

                            {error && (
                                <p className="mt-3 text-sm font-bold text-red-500">
                                    {error}
                                </p>
                            )}

                            <div className="mt-8 flex flex-col gap-3">
                                <Button
                                    children={loading ? "Menyimpan..." : "Simpan & Mulai Catat"}
                                    bgColor="bg-green-700"
                                    textColor="text-white"
                                    border={false}
                                    font="font-extrabold w-full"
                                    onClick={handleSaveMenu}
                                />

                                <button
                                    type="button"
                                    onClick={() => navigate("/Beranda")}
                                    className="text-sm font-bold text-gray-400 transition hover:text-gray-600"
                                >
                                    Lewati dulu, isi menu nanti
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default Register;
