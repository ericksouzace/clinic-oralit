import { useEffect, useState, useCallback, useSyncExternalStore } from "react";

const PREFIX = "oralit:";

export type Supply = {
  id: string;
  name: string;
  category: string;
  brand?: string;
  packCost: number;
  packYield: number;
  unit?: string;
  stock?: number;
  minStock?: number;
  note?: string;
};

export type FixedCost = {
  id: string;
  name: string;
  value: number;
};

export type Procedure = {
  id: string;
  name: string;
  category: string;
  defaultMinutes: number;
  labCost?: number;
  otherDirect?: number;
  note?: string;
};

export type Settings = {
  marginPct: number; // %
  reservePct: number;
  taxPct: number;
  cardFeePct: number;
  daysPerMonth: number;
  hoursPerDay: number;
  rounding: number; // 0, 5, 10, 50, 100
};

export type SupplyUsage = { supplyId: string; qty: number };
export type CustomCost = { name: string; value: number };

export type HistoryItem = {
  id: string;
  createdAt: number;
  procedureId: string;
  procedureName: string;
  minutes: number;
  labCost: number;
  otherDirect: number;
  supplies: SupplyUsage[];
  customCosts: CustomCost[];
  result: {
    suppliesCost: number;
    fixedProportional: number;
    realCost: number;
    targetPrice: number;
    pricePix: number;
    priceCard: number;
    estimatedProfit: number;
    netMargin: number;
  };
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  marginPct: 30,
  reservePct: 5,
  taxPct: 8,
  cardFeePct: 4.5,
  daysPerMonth: 22,
  hoursPerDay: 6,
  rounding: 5,
};

export const SUPPLY_CATEGORIES = [
  "Descartáveis","Anestesia","Dentística","Endodontia","Periodontia",
  "Cirurgia","Prótese","Ortodontia","Implantodontia","Radiologia",
  "Biossegurança","Laboratório","Outro"
];

export const PROCEDURE_CATEGORIES = [
  "Consulta","Profilaxia","Restauração","Clareamento","Endodontia",
  "Cirurgia","Periodontia","Prótese","Ortodontia","Implantodontia",
  "Radiologia","Outro"
];

const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  emit(key);
}

export function usePersisted<T>(key: string, fallback: T): [T, (v: T | ((p: T) => T)) => void] {
  const subscribe = useCallback((cb: () => void) => {
    let set = listeners.get(key);
    if (!set) { set = new Set(); listeners.set(key, set); }
    set.add(cb);
    return () => { set!.delete(cb); };
  }, [key]);
  const getSnap = useCallback(() => {
    if (typeof window === "undefined") return JSON.stringify(fallback);
    return localStorage.getItem(PREFIX + key) ?? JSON.stringify(fallback);
  }, [key, fallback]);
  const raw = useSyncExternalStore(subscribe, getSnap, () => JSON.stringify(fallback));
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const value: T = hydrated ? (() => {
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  })() : fallback;
  const setValue = useCallback((v: T | ((p: T) => T)) => {
    const next = typeof v === "function" ? (v as (p: T) => T)(value) : v;
    write(key, next);
  }, [key, value]);
  return [value, setValue];
}

export const useSupplies = () => usePersisted<Supply[]>("supplies", []);
export const useFixedCosts = () => usePersisted<FixedCost[]>("fixedCosts", []);
export const useProcedures = () => usePersisted<Procedure[]>("procedures", []);
export const useSettings = () => usePersisted<Settings>("settings", DEFAULT_SETTINGS);
export const useHistory = () => usePersisted<HistoryItem[]>("history", []);
export const useCustomSupplyCategories = () => usePersisted<string[]>("supplyCats", []);
export const useCustomProcedureCategories = () => usePersisted<string[]>("procCats", []);

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function clearAll() {
  if (typeof window === "undefined") return;
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
  ["supplies","fixedCosts","procedures","settings","history","supplyCats","procCats"].forEach(emit);
}
