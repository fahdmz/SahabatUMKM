import GradeCard from "./gradeCard";
function GradeCards() {
    const lmao =
        [
            {
                title: "konsistensi",
                grade: "B",
                description: "Hebat Bu! Ibu catat jualan 22 hari dari 31 hari. Tinggal 4 hari lagi rajin catat buat dapet nilai A bulan depan.",
            }
            // {
            //     title: "cuan (keuntungan)",
            //     grade: "B",
            //     description: "Untung Ibu naik 8% dari Juni. Tapi hati-hati, belanjaan Ibu agak bengkak pas di minggu gajian (minggu ke-3).",
            // },
            // {
            //     title: "pilihan menu",
            //     grade: "A",
            //     description: "Juara! Menu yang paling Ibu jagoin (Ricebowl Geprek) emang paling banyak kasih untung ke warung.",
            // },
        ]
    return (
        <>
            <div className="">
                {lmao.map((item) => (
                    <GradeCard
                        key={item.title}
                        title={item.title}
                        grade={item.grade}
                        description={item.description}
                    />
                ))}
            </div>
        </>
    );
}

export default GradeCards;