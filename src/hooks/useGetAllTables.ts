import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { COMMANDS } from "../lib/const";

export const useGetAllTables = () => {
  const [result, setResult] = useState<string[]>();

  const fn = useCallback(async () => {
    try {
      const tables = (await invoke(COMMANDS.QUERY, {
        sql: "SELECT name FROM sqlite_master WHERE type='table';",
      })) as string[];
      setResult(tables);
      return tables;
    } catch (error) {
      console.error(error);
    }
  }, []);

  return { tables: result, get: fn };
};
