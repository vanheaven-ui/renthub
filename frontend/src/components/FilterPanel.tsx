"use client";

import { Dispatch, SetStateAction, useState } from "react";

export interface FilterOptions {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
}

const FilterPanel = ({ filters, setFilters }: FilterPanelProps) => {
  const [minPrice, setMinPrice] = useState<string>(
    filters.minPrice?.toString() || ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    filters.maxPrice?.toString() || ""
  );

  const applyFilters = () => {
    setFilters({
      ...filters,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
    });
  };

  const clearFilters = () => {
    setFilters({ category: null, minPrice: null, maxPrice: null });
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 justify-center">
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
        Clear Filters
      </button>
    </div>
  );
};

export default FilterPanel;
