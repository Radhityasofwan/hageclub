import { Suspense } from "react";
import { CheckoutSuccessContent } from "./content";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-accent rounded" />
            <div className="h-4 w-96 bg-accent rounded" />
            <div className="h-32 w-full bg-accent rounded" />
            <div className="h-24 w-full bg-accent rounded" />
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
