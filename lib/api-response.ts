import { NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

type ApiSuccess<T> = {
  success: true;
  data?: T;
  message?: string;
};

type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  /** Only present in development mode — full server error details */
  devError?: DevErrorInfo;
};

interface DevErrorInfo {
  message: string;
  name?: string;
  /** Prisma error code, e.g. P2002 (unique constraint), P2003 (FK violation) */
  code?: string;
  /** Prisma error meta — e.g. { target: ["sku"] } */
  meta?: unknown;
  stack?: string;
}

function extractDevError(err: unknown): DevErrorInfo | undefined {
  if (!isDev || !err) return undefined;
  const e = err as Record<string, unknown>;
  return {
    message: typeof e.message === "string" ? e.message : String(err),
    name: typeof e.name === "string" ? e.name : undefined,
    code: typeof e.code === "string" ? e.code : undefined,
    meta: e.meta,
    stack: typeof e.stack === "string" ? e.stack : undefined,
  };
}

export function success<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function error(
  message: string,
  status = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, message, errors }, { status });
}

/** Use for catch blocks — includes full error detail in dev mode. */
export function serverError(
  message: string,
  err: unknown,
  status = 500
): NextResponse<ApiError> {
  if (isDev) {
    console.error(`[API 500] ${message}`, err);
  } else {
    console.error(`[API ${status}] ${message}`);
  }
  return NextResponse.json(
    { success: false, message, devError: extractDevError(err) },
    { status }
  );
}

export const apiResponse = { success, error, serverError };
