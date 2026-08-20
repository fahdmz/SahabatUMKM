import { useState } from "react";
import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";

function CatatBelanja() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
    ];

    const [rawText, setRawText] = useState("");
    const [parsedItems, setParsedItems] = useState(null);
    const [parseError, setParseError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // =========================
    // PARSE FREE TEXT
    // Example: "Minyak 28000, Ayam 150000"
    // =========================
    function parseBelanjaText(text) {
        const chunks = text
            .split(",")
            .map((chunk) => chunk.trim())
            .filter((chunk) => chunk.length > 0);

        const items = [];

        for (const chunk of chunks) {
            const match = chunk.match(/^(.+?)\s+([\d.,]+)$/);

            if (!match) {
                return {
                    items: null,
                    error: `Tidak bisa baca: "${chunk}". Coba format "Nama Barang Harga", contoh "Minyak 28000".`,
                };
            }

            const description = match[1].trim();
            const amountDigits = match[2].replace(/[.,]/g, "");
            const amount = parseInt(amountDigits, 10);

            if (!description || isNaN(amount) || amount <= 0) {
                return {
                    items: null,
                    error: `Tidak bisa baca: "${chunk}". Coba format "Nama Barang Harga", contoh "Minyak 28000".`,
                };
            }

            items.push({ description, amount });
        }

        if (items.length === 0) {
            return {
                items: null,
                error: "Belum ada belanjaan yang diketik.",
            };
        }

        return { items, error: null };
    }

    function handlePeriksa() {
        setSaveMessage("");

        const { items, error } = parseBelanjaText(rawText);

        if (error) {
            setParseError(error);
            setParsedItems(null);
            return;
        }

        setParseError("");
        setParsedItems(items);
    }

    // =========================
    // SAVE TO SUPABASE
    // =========================
    async function handleSimpan() {
        if (!parsedItems || parsedItems.length === 0) return;

        setSaving(true);
        setSaveMessage("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (!user) {
                setSaveMessage("Belum login.");
                setSaving(false);
                return;
            }

            const {
                data: businessData,
                error: businessError,
            } = await supabase
                .from("businesses")
                .select("*")
                .eq("owner_id", user.id);

            if (businessError || !businessData || businessData.length === 0) {
                console.error("GAGAL MENGAMBIL BUSINESS:", businessError);
                setSaveMessage("Gagal mengambil data bisnis.");
                setSaving(false);
                return;
            }

            const currentBusiness = businessData[0];

            const rows = parsedItems.map((item) => ({
                business_id: currentBusiness.id,
                description: item.description,
                amount: item.amount,
                spent_at: new Date().toISOString(),
            }));

            const { error: insertError } = await supabase
                .from("expenses")
                .insert(rows);

            if (insertError) {
                console.error("GAGAL SIMPAN EXPENSES:", insertError);
                setSaveMessage("Gagal menyimpan belanja.");
                setSaving(false);
                return;
            }

            setSaveMessage("Belanja berhasil dicatat!");
            setRawText("");
            setParsedItems(null);
        } catch (error) {
            console.error("SAVE CRASHED:", error);
            setSaveMessage("Terjadi kesalahan.");
        }

        setSaving(false);
    }

    return (
        <>
            <NavBar items={navItems} />
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col w-[95%] max-w-300 min-h-145 rounded-[40px] overflow-hidden shadow-2xl bg-white p-15">
                    <h1 className="font-extrabold text-4xl">Catat Belanja</h1>
                    <div className="">
                        <div className="mt-10 bg-red-200 rounded-3xl p-6 mr-80">
                            <p className="font-bold text-2xl text-red-800">
                                Belanja apa aja hari ini, Bu? Ketik aja kayak di WhatsApp: "Minyak 28000, Ayam 150000"
                            </p>
                        </div>
                        <p className="mt-6 text-gray-300 font-bold">ASISTEN BAKAL BANTU RAPIHIN CATATANNYA</p>

                        <div className="flex flex-row flex-1 gap-5 mt-4">

                            <div className="flex flex-[1] flex-col justify-center items-center bg-gray-100 border border-dashed border-gray-200 p-20 rounded-2xl">
                                <h1 className="font-extrabold text-2xl">Malas Ngetik? Foto Nota Saja!</h1>
                                <p className="text-gray-400">Nanti AI akan bacain nominal buat ibu.</p>
                                <div className="mt-10"></div>
                                <Button
                                    bgColor="white"
                                    children="Ambil Foto"
                                    font="font-bold"
                                    textColor="text-red-800"
                                />
                            </div>

                            <div className="flex flex-col flex-1">
                                <textarea
                                    className="flex flex-[1] font-bold p-6 bg-white border border-red-100 rounded-[32px] min-h-[300px] resize-none outline-none focus:ring-2 focus:ring-red-200 text-gray-700 placeholder-gray-300"
                                    placeholder="Ketik belanjaan di sini..."
                                    value={rawText}
                                    onChange={(e) => {
                                        setRawText(e.target.value);
                                        setParsedItems(null);
                                        setParseError("");
                                        setSaveMessage("");
                                    }}
                                ></textarea>

                                {parseError && (
                                    <p className="mt-2 text-sm font-bold text-red-600">
                                        {parseError}
                                    </p>
                                )}

                                {parsedItems && (
                                    <div className="mt-3 rounded-2xl bg-gray-50 p-4">
                                        <p className="text-sm font-bold text-gray-500">
                                            Ini yang ke-baca, cek dulu ya Bu:
                                        </p>
                                        <div className="mt-2 flex flex-col gap-1">
                                            {parsedItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between text-gray-700"
                                                >
                                                    <span>{item.description}</span>
                                                    <span className="font-bold">
                                                        Rp{item.amount.toLocaleString("id-ID")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 flex justify-between border-t border-gray-200 pt-2 font-extrabold text-gray-800">
                                            <span>Total</span>
                                            <span>
                                                Rp
                                                {parsedItems
                                                    .reduce((sum, item) => sum + item.amount, 0)
                                                    .toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {saveMessage && (
                                    <p className="mt-2 text-sm font-bold text-green-700">
                                        {saveMessage}
                                    </p>
                                )}

                                <div className="mt-2"></div>

                                {!parsedItems ? (
                                    <Button
                                        bgColor="bg-red-900"
                                        children="Periksa Dulu"
                                        font="font-bold"
                                        onClick={handlePeriksa}
                                    />
                                ) : (
                                    <Button
                                        bgColor="bg-red-900"
                                        children={saving ? "Menyimpan..." : "Simpan Belanja"}
                                        font="font-bold"
                                        onClick={handleSimpan}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CatatBelanja;