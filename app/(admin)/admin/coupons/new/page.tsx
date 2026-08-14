import { CouponForm } from "@/components/admin/coupon-form";

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">New Coupon</h1>
        <p className="text-sm text-muted">Create a new discount coupon or promotion.</p>
      </div>
      <CouponForm />
    </div>
  );
}
