"use client";
import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  onAddNew,
  addNewLabel = "+ Add New",
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Single input that acts as both trigger and search */}
      <div className={`flex items-center w-full rounded-md border bg-white transition-colors ${
        open ? "border-teal-500 ring-1 ring-teal-500" : "border-gray-300 hover:border-gray-400"
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={open ? search : (selected ? selected.label : "")}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-transparent outline-none rounded-md placeholder:text-gray-400"
          readOnly={false}
        />
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setOpen(true);
              setSearch("");
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          className="px-2 py-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 transition-colors flex items-center justify-between ${
                    opt.value === value ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700"
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-xs text-gray-400 ml-2">{opt.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>

          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-teal-600 font-medium hover:bg-teal-50 border-t border-gray-200"
            >
              {addNewLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
