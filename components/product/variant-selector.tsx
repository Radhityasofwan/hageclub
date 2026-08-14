"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

interface VariantSelectorProps {
  variants: ProductVariant[];
  onChange: (variant: ProductVariant | null) => void;
  error?: string;
  hideLabel?: boolean;
}

type AttributeMap = Record<string, string[]>; // { Size: ['S','M','L'], Color: ['Black'] }

function getAttributeMap(variants: ProductVariant[]): AttributeMap {
  const map: AttributeMap = {};
  for (const v of variants) {
    for (const [key, val] of Object.entries(v.attributes)) {
      if (!map[key]) map[key] = [];
      if (!map[key].includes(val)) map[key].push(val);
    }
  }
  return map;
}

function findMatchingVariant(
  variants: ProductVariant[],
  selections: Record<string, string>
): ProductVariant | null {
  const keys = Object.keys(selections);
  if (!keys.length) return null;

  return (
    variants.find((v) =>
      keys.every((k) => v.attributes[k] === selections[k])
    ) ?? null
  );
}

function isOptionAvailable(
  variants: ProductVariant[],
  currentSelections: Record<string, string>,
  attributeKey: string,
  value: string
): boolean {
  const testSelections = { ...currentSelections, [attributeKey]: value };
  const keys = Object.keys(testSelections);
  return variants.some(
    (v) =>
      v.isActive &&
      v.stock > 0 &&
      keys.every((k) => v.attributes[k] === testSelections[k])
  );
}

const COLOR_MAP: Record<string, string> = {
  Black: "#1C1C1E",
  White: "#FFFFFF",
  Gray: "#8E8E93",
  Navy: "#1B3A5E",
  Brown: "#7B4F2E",
  Olive: "#6B7C47",
  Red: "#FF3B30",
  Blue: "#007AFF",
  Green: "#34C759",
  Yellow: "#FFCC00",
  Orange: "#FF9500",
  Purple: "#AF52DE",
  Pink: "#FF2D55",
  Cream: "#F5F0E8",
  Maroon: "#7B2D2D",
  Teal: "#2D9596",
};

function parseColorValue(val: string): { name: string; hex: string } {
  if (val.includes("|")) {
    const [name, hex] = val.split("|", 2);
    return { name: name.trim(), hex: hex.trim() || "#cccccc" };
  }
  return { name: val, hex: COLOR_MAP[val] ?? "#cccccc" };
}

export function VariantSelector({
  variants,
  onChange,
  error,
  hideLabel = false,
}: VariantSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const attributeMap = getAttributeMap(variants);
  // Color is removed from the product detail page — each colorway is a separate product.
  const attributeKeys = Object.keys(attributeMap).filter(
    (k) => k.toLowerCase() !== "color"
  );

  useEffect(() => {
    const matched = findMatchingVariant(variants, selections);
    onChange(matched);
  }, [selections, variants, onChange]);

  if (!variants.length) return null;

  function select(key: string, value: string) {
    setSelections((prev) => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }

  return (
    <div className="space-y-5">
      {attributeKeys.map((key) => {
        const values = attributeMap[key];
        const isColor = key.toLowerCase() === "color";
        const selected = selections[key];

        const selectedDisplayName = selected && isColor
          ? parseColorValue(selected).name
          : selected;

        return (
          <div key={key}>
            {!hideLabel && (
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-primary">
                  {key}
                  {selectedDisplayName && (
                    <span className="ml-2 font-normal text-muted">{selectedDisplayName}</span>
                  )}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const available = isOptionAvailable(
                  variants,
                  selections,
                  key,
                  val
                );
                const isSelected = selected === val;

                if (isColor) {
                  const { name: colorName, hex } = parseColorValue(val);
                  return (
                    <button
                      key={val}
                      onClick={() => select(key, val)}
                      disabled={!available}
                      title={colorName}
                      aria-label={`${key}: ${colorName}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "w-8 h-8 rounded-sm border-2 transition-all relative",
                        isSelected ? "border-primary scale-110" : "border-transparent hover:border-muted",
                        !available && "opacity-30 cursor-not-allowed",
                        colorName === "White" && !isSelected && "border-border"
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {!available && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 14L14 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={val}
                    onClick={() => select(key, val)}
                    disabled={!available}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-w-[40px] h-10 px-3 text-sm font-medium border rounded-sm transition-colors relative",
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "border-border text-primary hover:border-primary",
                      !available &&
                        "opacity-40 cursor-not-allowed line-through decoration-muted"
                    )}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
