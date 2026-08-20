
function GradeCard({ title, grade, description }) {
    return (
        <>
            <div className="w-full max-w-xl">
                <div className="flex flex-col bg-white p-8 rounded-2xl">
                    <div className="flex justify-between">
                        <h1 className="text-2xl font-extrabold">{title}</h1>
                        <h2 className="font-extrabold text-2xl">{grade}</h2>
                    </div>
                    <p className="mt-10 text-lg text-gray-500">{description}</p>

                </div>
            </div>

        </>
    )
}

export default GradeCard;