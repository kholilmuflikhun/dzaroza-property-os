"use client";

import { useMemo, useState } from "react";

export type SearchableOption = { value: string; label: string; description?: string };

export function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Cari dan pilih…",
  emptyMessage = "Tidak ada data yang cocok.",
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    if (!term) return options.slice(0, 30);
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLocaleLowerCase("id-ID").includes(term),
    ).slice(0, 30);
  }, [options, query]);

  return (
    <div className="relative">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open && filtered[activeIndex] ? id + "-option-" + activeIndex : undefined}
        aria-label={label}
        autoComplete="off"
        required={required}
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        placeholder={placeholder}
        onFocus={() => { setQuery(""); setActiveIndex(0); setOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); if (value) onChange(""); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter" && open && filtered[activeIndex]) {
            event.preventDefault();
            onChange(filtered[activeIndex].value);
            setQuery("");
            setOpen(false);
          } else if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      />
      {open && !disabled && (
        <div id={`${id}-options`} role="listbox" aria-label={label} className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">{emptyMessage}</p>
          ) : filtered.map((option, index) => (
            <button
              key={option.value}
              id={id + "-option-" + index}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => { onChange(option.value); setQuery(""); setOpen(false); }}
              className={"flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none " + (index === activeIndex ? "bg-blue-50" : "")}
            >
              <span className="text-sm font-medium text-slate-800">{option.label}</span>
              {option.description && <span className="mt-0.5 text-xs text-slate-500">{option.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
