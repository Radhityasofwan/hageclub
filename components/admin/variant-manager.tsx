"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUICK_COLORS = [
  { name: "Black", hex: "#1C1C1E" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#8E8E93" },
  { name: "Navy", hex: "#1B3A5E" },
  { name: "Red", hex: "#FF3B30" },
  { name: "Blue", hex: "#007AFF" },
  { name: "Green", hex: "#34C759" },
  { name: "Brown", hex: "#7B4F2E" },
  { name: "Olive", hex: "#6B7C47" },
  { name: "Yellow", hex: "#FFCC00" },
  { name: "Orange", hex: "#FF9500" },
  { name: "Purple", hex: "#AF52DE" },
  { name: "Pink", hex: "#FF2D55" },
  { name: "Cream", hex: "#F5F0E8" },
  { name: "Maroon", hex: "#7B2D2D" },
  { name: "Teal", hex: "#2D9596" },
];

const COLOR_QUICK_MAP: Record<string, string> = Object.fromEntries(
  QUICK_COLORS.map(({ name, hex }) => [name, hex])
);

function parseAdminColor(raw: string): { name: string; hex: string } {
  if (raw.includes("|")) {
    const [name, hex] = raw.split("|", 2);
    return { name: name.trim(), hex: hex.trim() || "#1C1C1E" };
  }
  return { name: raw, hex: COLOR_QUICK_MAP[raw] ?? "#1C1C1E" };
}

interface Variant {
  id?: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  attributes: Record<string, string>;
  isActive: boolean;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  attributeOptions?: {
    name: string;
    values: string[];
  }[];
}

export function VariantManager({
  variants,
  onChange,
  attributeOptions,
}: VariantManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function addVariant() {
    const newVariant: Variant = {
      name: `Variant ${variants.length + 1}`,
      sku: "",
      price: null,
      stock: 0,
      attributes: {},
      isActive: true,
    };
    onChange([...variants, newVariant]);
    setExpandedIndex(variants.length);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  }

  function updateVariant(index: number, field: keyof Variant, value: unknown) {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    onChange(updated);
  }

  function updateAttribute(
    index: number,
    key: string,
    value: string
  ) {
    const updated = variants.map((v, i) =>
      i === index
        ? { ...v, attributes: { ...v.attributes, [key]: value } }
        : v
    );
    onChange(updated);
  }

  function generateSku(index: number) {
    const baseSku = prompt("Enter base SKU (e.g., TSHIRT):", "PROD");
    if (!baseSku) return;
    const variant = variants[index];
    const attrStr = Object.values(variant.attributes)
      .map((v) => v.toUpperCase().slice(0, 3))
      .join("-");
    const generatedSku = attrStr
      ? `${baseSku}-${attrStr}`
      : `${baseSku}-${String(index + 1).padStart(2, "0")}`;
    updateVariant(index, "sku", generatedSku);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-primary">Variants</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addVariant}
        >
          + Add Variant
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="text-xs text-muted py-4 text-center border border-dashed border-border rounded">
          No variants yet. Add size, color, or other variations.
        </p>
      )}

      <div className="space-y-2">
        {variants.map((variant, index) => (
          <div
            key={index}
            className="border border-border rounded"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{variant.name}</span>
                {variant.sku && (
                  <span className="text-xs text-muted font-mono">
                    {variant.sku}
                  </span>
                )}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded font-medium",
                  variant.stock > 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}>
                  {variant.stock}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!variant.isActive && (
                  <span className="text-[10px] text-muted bg-accent px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={cn(
                    "w-3 h-3 text-muted transition-transform",
                    expandedIndex === index && "rotate-180"
                  )}
                >
                  <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {/* Expanded form */}
            {expandedIndex === index && (
              <div className="px-4 py-3 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Variant Name"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, "name", e.target.value)}
                    placeholder="e.g., Small / Red"
                  />
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <Input
                        label="SKU"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                        placeholder="e.g., TSHIRT-S-RED"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => generateSku(index)}
                      className="h-10 px-2 bg-accent rounded text-xs text-muted hover:text-primary"
                      title="Auto-generate SKU"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {(attributeOptions?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {attributeOptions?.map((attr) => {
                      const isColorAttr = attr.name.toLowerCase() === "color";

                      if (isColorAttr) {
                        const { name: colorName, hex: colorHex } = parseAdminColor(
                          variant.attributes[attr.name] ?? ""
                        );
                        return (
                          <div key={attr.name} className="col-span-2">
                            <label className="block text-sm font-medium text-primary mb-1.5">
                              Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={colorHex}
                                onChange={(e) =>
                                  updateAttribute(
                                    index,
                                    attr.name,
                                    `${colorName}|${e.target.value}`
                                  )
                                }
                                className="w-10 h-10 rounded cursor-pointer border border-border p-0.5 bg-white shrink-0"
                                title="Pilih warna"
                              />
                              <input
                                type="text"
                                value={colorName}
                                onChange={(e) =>
                                  updateAttribute(
                                    index,
                                    attr.name,
                                    `${e.target.value}|${colorHex}`
                                  )
                                }
                                placeholder="Nama warna (cth: Navy Blue, Burnt Orange)"
                                className="flex-1 h-10 px-3 text-sm border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {QUICK_COLORS.map(({ name, hex }) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() =>
                                    updateAttribute(index, attr.name, `${name}|${hex}`)
                                  }
                                  title={name}
                                  className={cn(
                                    "w-6 h-6 rounded border-2 transition-all",
                                    colorName === name
                                      ? "border-primary scale-110"
                                      : "border-transparent hover:border-muted",
                                    name === "White" && "border-border hover:border-primary"
                                  )}
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={attr.name}>
                          <label className="block text-sm font-medium text-primary mb-1.5">
                            {attr.name}
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {attr.values.map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateAttribute(index, attr.name, val)}
                                className={cn(
                                  "px-2.5 py-1 text-xs rounded border transition-colors",
                                  variant.attributes[attr.name] === val
                                    ? "bg-primary text-white border-primary"
                                    : "border-border text-muted hover:border-primary hover:text-primary"
                                )}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Price (override)"
                    type="number"
                    value={variant.price ?? ""}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "price",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="Use base price"
                  />
                  <Input
                    label="Stock"
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "stock",
                        Math.max(0, Number(e.target.value))
                      )
                    }
                  />
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer pb-1.5">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(e) =>
                          updateVariant(index, "isActive", e.target.checked)
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="text-destructive"
                  >
                    Remove Variant
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
