"use client";

import { Dispatch, SetStateAction, useState } from "react";

export interface FilterOptions {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  search: string | null;
  location: string | null;
}

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
  categories: string[];
  onFilterApply?: () => void; // optional callback for scroll/apply
  isCompact?: boolean; // determines compact vs full layout
}

const FilterPanel = ({
  filters,
  setFilters,
  categories,
  onFilterApply,
  isCompact = false,
}: FilterPanelProps) => {
  const [minPrice, setMinPrice] = useState<string>(
    filters.minPrice?.toString() || ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    filters.maxPrice?.toString() || ""
  );
  const [search, setSearch] = useState<string>(filters.search || "");
  const [location, setLocation] = useState<string>(filters.location || "");

  const applyFilters = () => {
    setFilters({
      ...filters,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      search: search || null,
      location: location || null,
    });

    if (onFilterApply) onFilterApply();
  };

  const clearFilters = () => {
    setFilters({
      category: null,
      minPrice: null,
      maxPrice: null,
      search: null,
      location: null,
    });
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
    setLocation("");
  };

  const toggleCategory = (cat: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === cat ? null : cat,
    }));

    if (onFilterApply) onFilterApply();
  };

  return (
    <div
      className={`flex flex-col items-center gap-4 mb-6 ${
        isCompact ? "max-w-xl mx-auto" : ""
      }`}
    >
      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`px-5 py-2 rounded-full font-semibold transition ${
              filters.category === cat
                ? "bg-pink-500 text-white shadow-lg"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Only render the full search/filter inputs if not compact */}
      {!isCompact && (
        <div className="flex flex-wrap items-center gap-3 justify-center mt-3">
          <input
            type="text"
            placeholder="Search by title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-purple-600 text-white rounded-2xl shadow hover:bg-purple-700 transition"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl shadow hover:bg-gray-400 transition"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
