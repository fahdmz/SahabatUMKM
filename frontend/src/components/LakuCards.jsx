import LakuCard from "./LakuCard";

function LakuCards({ sales }) {

    if (!sales || sales.length === 0) {
        return null;
    }

    return (
        <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">

            {sales.map((item, index) => (
                <LakuCard
                    key={item.id}
                    rank={index + 1}
                    NamaMenu={item.name}
                    Porsi={item.total_porsi}
                    Pemasukan={item.total_pemasukan}
                />
            ))}

        </div>
    );
}

export default LakuCards;