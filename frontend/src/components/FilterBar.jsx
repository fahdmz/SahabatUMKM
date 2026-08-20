import FilterButton from "./FilterButton";

function FilterBar({ activeFilter, setActiveFilter }) {
    const filters = [
        {
            label: "Hari ini",
            value: "today",
        },
        {
            label: "Minggu ini",
            value: "week",
        },
        {
            label: "Bulan ini",
            value: "month",
        },
    ];

    return (
        <div className="flex gap-2 rounded-xl bg-white p-1">
            {filters.map((filter) => (
                <FilterButton
                    key={filter.value}
                    label={filter.label}
                    selected={activeFilter === filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                />
            ))}
        </div>
    );
}

export default FilterBar;