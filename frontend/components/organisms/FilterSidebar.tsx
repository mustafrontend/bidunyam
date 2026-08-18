"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export type FilterState = {
  kategori?: string;
  altkategori?: string;
  marka?: string[];
  minFiyat?: string;
  maxFiyat?: string;
  [key: string]: any; // Allow dynamic attr_ fields
};

interface FilterSidebarProps {
  filters: FilterState;
  options: {
    brands: string[];
    categories: Array<{ name: string; subCategories: string[] }>;
  };
  dynamicFacets?: Array<{ name: string; options: string[] }>;
  onFilterChange: (key: string, value: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, options = { brands: [], categories: [] }, dynamicFacets = [], onFilterChange }) => {
  const [brandSearch, setBrandSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    brand: true,
    price: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBrandToggle = (brand: string) => {
    const current = filters.marka || [];
    const updated = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand];
    onFilterChange("marka", updated);
  };

  const activeCategoryData = (options?.categories || []).find((c) => c?.name === filters.kategori);
  const subCatsToShow = activeCategoryData?.subCategories || [];

  const filteredBrands = (options?.brands || []).filter((b) => typeof b === "string" && b.toLowerCase().includes(brandSearch.toLowerCase())).slice(0, 50);

  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
      {/* İlgili Kategoriler */}
      {filters.kategori && subCatsToShow.length > 0 && (
        <div className="bg-white rounded-xl border-[0.5px] border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => toggleSection("category")}>
            <h3 className="font-bold text-slate-800 tracking-tight">İlgili Kategoriler</h3>
            {openSections.category ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
          {openSections.category && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              <button
                onClick={() => onFilterChange("altkategori", undefined)}
                className={`text-left w-full block py-1 text-sm transition-colors ${!filters.altkategori ? "font-bold text-orange-500" : "text-slate-600 hover:text-orange-500"}`}
              >
                Tümü
              </button>
              {subCatsToShow.map((sub) => (
                <button
                  key={sub}
                  onClick={() => onFilterChange("altkategori", sub)}
                  className={`text-left w-full block py-1 text-sm transition-colors ${filters.altkategori === sub ? "font-bold text-orange-500" : "text-slate-600 hover:text-orange-500"}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Markalar */}
      <div className="bg-white rounded-xl border-[0.5px] border-slate-200 p-5 shadow-sm">
        <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => toggleSection("brand")}>
          <h3 className="font-bold text-slate-800 tracking-tight">Marka</h3>
          {openSections.brand ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {openSections.brand && (
          <>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Marka ara..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {filteredBrands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(filters.marka || []).includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors truncate">{brand}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fiyat Aralığı */}
      <div className="bg-white rounded-xl border-[0.5px] border-slate-200 p-5 shadow-sm">
        <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => toggleSection("price")}>
          <h3 className="font-bold text-slate-800 tracking-tight">Fiyat</h3>
          {openSections.price ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {openSections.price && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="En Az"
              value={filters.minFiyat || ""}
              onChange={(e) => onFilterChange("minFiyat", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="En Çok"
              value={filters.maxFiyat || ""}
              onChange={(e) => onFilterChange("maxFiyat", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Dinamik Filtreler (Facets) */}
      {(dynamicFacets || []).map((facet) => {
        if (!facet || !facet.name) return null;
        const isOpen = openSections[`facet_${facet.name}`] ?? true;
        const attrKey = `attr_${facet.name}`;
        const selectedValues = (filters[attrKey] as string[]) || [];

        return (
          <div key={facet.name} className="bg-white rounded-xl border-[0.5px] border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => toggleSection(`facet_${facet.name}`)}>
              <h3 className="font-bold text-slate-800 tracking-tight">{facet.name}</h3>
              {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>
            {isOpen && (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                {(facet.options || []).map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={() => {
                        const updated = selectedValues.includes(option)
                          ? selectedValues.filter((v) => v !== option)
                          : [...selectedValues, option];
                        onFilterChange(attrKey, updated);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors truncate">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
