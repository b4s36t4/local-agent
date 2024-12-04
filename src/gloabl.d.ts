// import { DirEntry } from "@tauri-apps/plugin-fs";

interface Repo {
  [key: string]: import("@tauri-apps/plugin-fs").DirEntry[];
}

interface Indexes {
  [key: string]: boolean;
}

interface AppStore {
  repo: Repo;
}
