import { useCallback } from "react";
import { useGetAllTables } from "./useGetAllTables";
import { COMMANDS, TABLE_NAMES } from "../lib/const";
import { invoke } from "@tauri-apps/api/core";
import { join, resolve } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import { MIGRATIONS } from "../lib/db/migrations";

const MIGRATION_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const decoder = new TextDecoder();

// const dirname = path.
const MIGRATION_BASE_PATH = await resolve("..", "src", "lib", "db", "sql");

export const useExecuteMigrations = () => {
  const { tables, get } = useGetAllTables();

  const run = useCallback(async () => {
    const tables = (await get()) as string[];
    const isMigrationTableExists = tables.includes(TABLE_NAMES.MIGRATIONS);
    if (!isMigrationTableExists) {
      try {
        await invoke(COMMANDS.EXECUTE, {
          sql: MIGRATION_TABLE,
        });
      } catch (error) {
        console.error(error);
        return;
      }
    }

    const current_migrations = (await invoke(COMMANDS.QUERY, {
      sql: `SELECT migration_name FROM migrations ;`,
    })) as string[];
    const migrations = MIGRATIONS as any;
    const migrations_names = Object.keys(migrations);
    // Run migrations for each entry from `migrations.ts`
    for (const migration_name of migrations_names) {
      if (current_migrations.includes(migration_name)) {
        continue;
      }
      const sql_path = await join(
        MIGRATION_BASE_PATH,
        migrations[migration_name]
      );
      const code_buffer = await readFile(sql_path);
      const code_text = decoder.decode(code_buffer).toString();

      console.log(`Running Migration ${migration_name}`);
      console.log(code_text);
      try {
        const res = await invoke(COMMANDS.EXECUTE, {
          sql: code_text,
          isBatch: true,
        });
        console.log(res);
        // migrations always should be batch;
        await invoke(COMMANDS.EXECUTE, {
          sql: `insert into migrations(migration_name) values ('${migration_name}');`,
        });
      } catch (error) {
        console.log(error, "ee");
        console.error(
          `Failed to run migration - ${migration_name} with error ${error} `
        );
      }
    }
  }, [tables]);

  return { tables, run };
};
