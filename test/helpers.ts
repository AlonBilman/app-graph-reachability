// test/helpers.ts
import type { Func, Vulnerability } from "../src/types";

export const F = (id: string, isEntrypoint = false, name = id): Func => ({
  id,
  name,
  isEntrypoint,
});

export const V = (
  id: string,
  funcId: string,
  severity: Vulnerability["severity"],
  extra?: Partial<Vulnerability>,
): Vulnerability => ({
  id,
  funcId,
  severity,
  reachable: false,
  ...extra,
});

export function mockReq(opts?: {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, any>;
}) {
  return {
    body: opts?.body ?? {},
    params: opts?.params ?? {},
    query: opts?.query ?? {},
  } as any;
}

export function mockRes() {
  let statusCode = 200;
  let jsonBody: any = undefined;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      jsonBody = payload;
      return this;
    },
    _get() {
      return { statusCode, jsonBody };
    },
  } as any;
}
