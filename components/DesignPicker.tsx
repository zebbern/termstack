'use client';

import { useEffect, useRef, useState } from 'react';
import type { DesignTemplate, DesignCategory } from '@/data/design-catalog';

interface DesignPickerProps {
  value: string;
  onChange: (value: string) => void;
  designs: DesignTemplate[];
  categories: readonly DesignCategory[];
}

export default function DesignPicker({ value, onChange, designs, categories }: DesignPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const selected = designs.find((d) => d.id === value);

  const designsByCategory: Record<string, DesignTemplate[]> = {};
  for (const cat of categories) {
    const items = designs.filter((d) => d.category === cat);
    if (items.length > 0) designsByCategory[cat] = items;
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-center text-sm text-[var(--app-text)] outline-none"
      >
        {selected ? (
          <>
            <span className="flex shrink-0 gap-0.5">
              {selected.colors.slice(0, 5).map((c, i) => (
                <span
                  key={i}
                  className="inline-block h-2.5 w-2.5 rounded-sm border border-white/20"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          'Design'
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1 max-h-72 w-60 overflow-y-auto rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] shadow-xl">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-[var(--app-muted)] hover:bg-[var(--app-surface-2)]"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            No design template
          </button>

          {categories.map((cat) => {
            const items = designsByCategory[cat];
            if (!items) return null;
            return (
              <div key={cat}>
                <div className="sticky top-0 bg-[var(--app-card)] px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--app-muted)]">
                  {cat}
                </div>
                {items.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[var(--app-surface-2)] ${
                      value === tmpl.id
                        ? 'bg-[var(--app-surface-2)] text-[var(--app-text)]'
                        : 'text-[var(--app-text)]'
                    }`}
                    onClick={() => {
                      onChange(tmpl.id);
                      setIsOpen(false);
                    }}
                  >
                    <span className="flex shrink-0 gap-0.5">
                      {tmpl.colors.slice(0, 5).map((c, i) => (
                        <span
                          key={i}
                          className="inline-block h-3 w-3 rounded-sm border border-white/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                    <span className="truncate">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
