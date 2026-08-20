import React from "react";
import LakuCard from "./LakuCard";

function LakuCards({ sales }) {

    // Data Sementara
    // const menus = [
    //     {
    //         NamaMenu: "Es Teh Manis",
    //         Porsi: "14",
    //         Pemasukan: "70.000"
    //     },
    //     {
    //         NamaMenu: "Ricebowl Ayam Geprek",
    //         Porsi: "12",
    //         Pemasukan: "240.000"
    //     },
    //     {
    //         NamaMenu: "Es Teh Manis",
    //         Porsi: "14",
    //         Pemasukan: "70.000"
    //     },
    //     {
    //         NamaMenu: "Ricebowl Ayam Geprek",
    //         Porsi: "12",
    //         Pemasukan: "240.000"
    //     }, {
    //         NamaMenu: "Es Teh Manis",
    //         Porsi: "14",
    //         Pemasukan: "70.000"
    //     },
    //     {
    //         NamaMenu: "Ricebowl Ayam Geprek",
    //         Porsi: "12",
    //         Pemasukan: "240.000"
    //     }, {
    //         NamaMenu: "Es Teh Manis",
    //         Porsi: "14",
    //         Pemasukan: "70.000"
    //     },
    //     {
    //         NamaMenu: "Ricebowl Ayam Geprek",
    //         Porsi: "12",
    //         Pemasukan: "240.000"
    //     }
    // ]
    return (
        <>
            <div className="flex flex-col max-h-150 gap-4 overflow-y-auto pr-2">
                {sales.map((item) => (
                    <LakuCard
                        key={item.id}
                        NamaMenu={item.name}
                        Porsi={item.total_porsi}
                        Pemasukan={item.total_pemasukan}
                    />
                ))}
            </div>
        </>
    )
}

export default LakuCards;