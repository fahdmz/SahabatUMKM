import NavBar from "../components/Navbar";
function GrafikBisnis() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" }
    ];
    return (
        <>
            <NavBar items={navItems} />
        </>
    )
}
export default GrafikBisnis;