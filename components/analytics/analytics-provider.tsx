import { getSettingValues } from "@/lib/settings";
import { GA4 } from "./ga4";
import { MetaPixel } from "./meta-pixel";

export async function AnalyticsProvider() {
  const keys = ["analytics_ga4_id", "analytics_meta_pixel_id"];
  const values = await getSettingValues(keys);

  const ga4Id = values.analytics_ga4_id;
  const pixelId = values.analytics_meta_pixel_id;

  return (
    <>
      <GA4 measurementId={ga4Id} />
      <MetaPixel pixelId={pixelId} />
    </>
  );
}
