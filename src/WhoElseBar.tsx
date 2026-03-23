"use client";

import type { CategoryMatch } from "@/types";

interface WhoElseBarProps {
  options: CategoryMatch[];
  onSelect: (slug: string) => void;
}

export function WhoElseBar({ options, onSelect }: WhoElseBarProps) {
  if (options.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-400">Who else?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map((opt) => (
          <button
            key={opt.slug}
            onClick={() => onSelect(opt.slug)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs whitespace-nowrap hover:border-blue-400 hover:bg-blue-50 transition-all shrink-0"
          >
            <span>{opt.icon}</span>
            <span className="text-gray-700">{opt.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
