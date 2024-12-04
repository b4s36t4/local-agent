import { load, Store as AppStore } from "@tauri-apps/plugin-store";
import { STORE_KEYS } from "./const";

export class Store {
  static _store: AppStore;

  static async loadStore() {
    if (!this._store) {
      this._store = await load(STORE_KEYS.APP_CONFIG, { autoSave: true });
    }
    return this._store;
  }

  static async get(key: string, fallback?: unknown) {
    return (await this._store.get(key)) || fallback;
  }

  static set(key: string, value: unknown) {
    return this._store.set(key, value);
  }
}
