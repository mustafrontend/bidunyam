"use client";

import React from 'react';

const CATEGORIES = [
  "Kadın", "Erkek", "Anne & Çocuk", "Ev & Yaşam", "Süpermarket", 
  "Kozmetik", "Ayakkabı & Çanta", "Saat & Aksesuar", "Elektronik", "Spor & Outdoor"
];

interface CategoryBarProps {
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="bg-white border-b-[0.5px] border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="max-w-7xl mx-auto flex items-center h-12 md:h-14">
        <button 
          onClick={() => onSelectCategory(null)}
          className={`px-4 md:px-6 h-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-b-2 hover:text-brand-orange ${!activeCategory ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-600'}`}
        >
          Tümü
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-4 md:px-6 h-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-b-2 hover:text-brand-orange ${activeCategory === cat ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
