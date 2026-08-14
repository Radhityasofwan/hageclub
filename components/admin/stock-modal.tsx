"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    stock: number;
  };
  variant?: {
    id: string;
    name: string;
    stock: number;
  } | null;
  onSuccess: () => void;
}

export function StockModal({
  isOpen,
  onClose,
  product,
  variant,
  onSuccess,
}: StockModalProps) {
  const [type, setType] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentStock = variant ? variant.stock : product.stock;
  const targetLabel = variant ? `${product.name} — ${variant.name}` : product.name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type !== "SET" && amount <= 0) {
      setError("Amount must be positive");
      return;
    }
    if (type === "SUBTRACT" && amount > currentStock) {
      setError("Cannot subtract more than current stock");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        productId: product.id,
        variantId: variant?.id ?? null,
        type,
        amount: type === "SET" ? amount : amount,
        reason: reason || undefined,
      };

      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Failed to adjust stock");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock: ${targetLabel}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-muted">
          Current stock: <strong className="text-primary">{currentStock}</strong>
        </p>

        <Select
          label="Adjustment Type"
          options={[
            { value: "ADD", label: "Add Stock" },
            { value: "SUBTRACT", label: "Subtract Stock" },
            { value: "SET", label: "Set to Exact Value" },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        />

        <Input
          label={type === "SET" ? "New Stock Value" : "Amount"}
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          required
        />

        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Restock, damaged item, etc."
        />

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {type === "ADD"
              ? "Add Stock"
              : type === "SUBTRACT"
                ? "Subtract Stock"
                : "Set Stock"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
