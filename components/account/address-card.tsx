import { Button } from "@/components/ui/button";

interface AddressCardProps {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function AddressCard({
  id,
  label,
  recipientName,
  phone,
  street,
  district,
  city,
  province,
  postalCode,
  isDefault,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <div className="border border-border rounded-sm p-4 relative">
      {isDefault && (
        <span className="absolute top-3 right-3 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
          Default
        </span>
      )}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <p className="text-sm">{recipientName}</p>
        <p className="text-xs text-muted">{phone}</p>
        <p className="text-xs text-muted">{street}</p>
        <p className="text-xs text-muted">
          {district}, {city}, {province} {postalCode}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(id)}>
          Edit
        </Button>
        {!isDefault && (
          <Button variant="ghost" size="sm" onClick={() => onSetDefault(id)}>
            Set as Default
          </Button>
        )}
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
