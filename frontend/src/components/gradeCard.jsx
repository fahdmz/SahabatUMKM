function GradeCard({ title, grade, description }) {
    return (
        <div className="w-full">
            <div className="flex min-h-[190px] flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

                <div className="flex items-start justify-between">
                    <h1 className="text-sm font-extrabold uppercase tracking-[0.15em] text-gray-400">
                        {title}
                    </h1>

                    <h2 className="text-3xl font-extrabold text-[#171512]">
                        {grade}
                    </h2>
                </div>

                <p className="mt-8 text-base font-bold leading-relaxed text-gray-600">
                    {description}
                </p>

            </div>
        </div>
    );
}

export default GradeCard;