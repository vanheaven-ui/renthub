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
  onFilterApply?: () => void; // optional callback for scroll/apply
  isCompact?: boolean; // determines compact vs full layout
}

const FilterPanel = ({
  filters,
  setFilters,
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
      category: filters.category || null,
      minPrice: null,
      maxPrice: null,
      search: null,
      location: null,
    });
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
    setLocation("");
    if (onFilterApply) onFilterApply();
  };

  return (
    <div
      className={`flex flex-col items-center gap-4 mb-6 ${
        isCompact ? "max-w-xl mx-auto" : ""
      }`}
    >
      {!isCompact && (
        <div className="flex flex-wrap items-center gap-3 justify-center mt-3 w-full">
          <input
            type="text"
            placeholder="Search by title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] md:min-w-[220px] px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 min-w-[120px] md:min-w-[160px] px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="flex-1 min-w-[100px] md:min-w-[140px] px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="flex-1 min-w-[100px] md:min-w-[140px] px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
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
