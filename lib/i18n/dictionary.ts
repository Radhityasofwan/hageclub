type Dictionary = Record<string, unknown>;

export function getNestedValue(obj: Dictionary, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Dictionary)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return Object.entries(params).reduce((str, [key, value]) => {
    return str.replace(`{${key}}`, String(value));
  }, template);
}

export function translate(
  dict: Dictionary,
  key: string,
  params?: Record<string, string | number>
): string {
  const value = getNestedValue(dict, key);
  if (value === undefined) return key;
  return interpolate(value, params);
}
