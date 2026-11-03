import { randomUUID } from "node:crypto";
import type { NewScreen, ScreenRecord, ScreenStore } from "../types.js";

export function createMemoryStore(): ScreenStore {
  const rows: ScreenRecord[] = [];

  return {
    async insert(screen: NewScreen): Promise<ScreenRecord> {
      const record: ScreenRecord = {
        id: randomUUID(),
        ...screen,
        createdAt: new Date().toISOString(),
      };
      rows.unshift(record);
      return record;
    },
    async list(limit: number): Promise<ScreenRecord[]> {
      return rows.slice(0, limit);
    },
    async get(id: string): Promise<ScreenRecord | null> {
      return rows.find((row) => row.id === id) ?? null;
    },
    async remove(id: string): Promise<boolean> {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}
