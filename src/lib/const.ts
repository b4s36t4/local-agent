export const STORE_KEYS = {
  APP_CONFIG: "app-config.json",
  REPO: "repo",
  INDEXES: "index",
};

export enum COMMANDS {
  VERSION = "plugin:vector-store|version",
  TEST = "plugin:vector-store|test",
  QUERY = "plugin:vector-store|query_sql",
  EXECUTE = "plugin:vector-store|execute_sql",
  RUN_MIGRATION = "plugin:vector-store|run_migration",
  // FORBIDDEN
  EMBED = "plugin:vector-store|embed",
  DOWNLOAD = "plugin:vector-store|download",
}

export enum TABLE_NAMES {
  MIGRATIONS = "migrations",
  CODE_INDEXES = "code_indexes",
  CONVERSATIONS = "conversation",
}
