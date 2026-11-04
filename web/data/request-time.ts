import "server-only";
import { connection } from "next/server";
import { cache } from "react";

export const getRequestTime = cache(async (): Promise<number> => {
  await connection();
  return Date.now();
});
