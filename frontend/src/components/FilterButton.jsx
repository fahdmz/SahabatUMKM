
function FilterButton({ label, selected, onClick }) {
    return (
        <>
            <button
                onClick={onClick}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200
                ${selected
                        ? "bg-green-600 text-white"
                        : "bg-transparent text-black hover:bg-gray-100"
                    }
                `}
            >
                {label}
            </button>
        </>
    )
}

export default FilterButton;