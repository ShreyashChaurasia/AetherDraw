import { nanoid } from "nanoid";

export function generateElementId(prefix?: string): string {
  const id = nanoid(10);
  return prefix ? `${prefix}_${id}` : id;
}
