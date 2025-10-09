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
