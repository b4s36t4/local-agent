import { join } from "@tauri-apps/api/path";
import { STORE_KEYS } from "./const";
import { Store } from "./store";
import { readDir, readFile } from "@tauri-apps/plugin-fs";
import { cat } from "@huggingface/transformers";
import { path } from "@tauri-apps/api";

const SKIP_FILES = ["png", "jpeg", "jpg", "webp", "gif"];
const FOLDERS_TO_SKIP = ["node_modules", ".vscode", "public", "build", "dist"];
const FILES_TO_SKIP = [
  "package-lock.json",
  "bun.lockb",
  "pnpm-lock.yaml",
  "yarn-lock.yaml",
  "Cargo.lock",
];

const decoder = new TextDecoder();
const _window = window as any;

type ListenerFunction = (body: {
  file: string;
  status: "started" | "completed" | "failed";
  isError?: boolean;
  isFolder?: boolean;
  log?: string;
}) => void;

const getListeners = (): Map<string, ListenerFunction> => {
  if ((_window as any).listeners) {
    return _window.listeners;
  }
  _window.listeners = new Map();
  return _window.listeners;
};

const removeListener = function (this: { id: string }) {
  getListeners().delete(this.id);
};

export const addListener = (callback: ListenerFunction) => {
  const id = window.crypto.randomUUID();
  getListeners().set(id, callback);

  return removeListener.bind({ id });
};
export const indexFile = async (file: string) => {
  if (FILES_TO_SKIP.includes(await path.basename(file))) {
    return;
  }
  try {
    const fileContent = await readFile(file);
    const extension = file.split(".").at(-1);
    if (SKIP_FILES.includes(extension ?? "")) {
      return;
    }
    const _content = decoder.decode(fileContent).toString();
  } catch (err) {
    console.log(err);
  }
};

const publisLogs = (body: {
  file: string;
  status: "completed" | "started" | "failed";
  isError?: boolean;
  isFolder?: boolean;
  log?: string;
}) => {
  const listeners = Array.from(getListeners().values());
  for (const listener of listeners) {
    listener?.(body);
  }
};

export const indexFolder = async (folder: string) => {
  if (FOLDERS_TO_SKIP.includes(await path.basename(folder))) {
    return;
  }
  try {
    const files = await readDir(folder);
    for (let index = 0; index < files.length; index++) {
      const entry = files[index];
      const path = await join(folder, entry.name);
      try {
        if (entry.isFile) {
          publisLogs({ file: path, status: "started" });
          await indexFile(path);
          publisLogs({ file: path, status: "completed" });
        }
      } catch {
        publisLogs({ file: path, status: "failed" });
      }
      try {
        if (entry.isDirectory) {
          publisLogs({ isFolder: true, file: path, status: "started" });
          await indexFolder(path);
          publisLogs({ isFolder: true, file: path, status: "completed" });
        }
      } catch {
        publisLogs({
          isFolder: true,
          file: path,
          status: "failed",
          isError: true,
        });
      }
    }
  } catch {
    console.log("Failed to readdir", folder);
  }
};

export const traverseRepo = async (path?: string) => {
  const repo = (await Store.get(STORE_KEYS.REPO)) as AppStore["repo"];
  const indexes = (await Store.get(STORE_KEYS.INDEXES, {})) as Record<
    string,
    any
  >;

  if (path) {
    const repoTree = repo[path];
    if (!repoTree) {
      return;
    }
    const isIndexed = Object.keys(indexes).includes(path);
    if (isIndexed) {
      // Update the index set
      await Store.set(STORE_KEYS.INDEXES, { ...indexes, [path]: true });
      return;
    }

    for (let index = 0; index < repoTree.length; index++) {
      const entry = repoTree[index];
      if (entry.isFile) {
        await indexFile(await join(path, entry.name));
      }
      if (entry.isDirectory) {
        await indexFolder(await join(path, entry.name));
      }
    }
  } else {
    throw new Error("Not Implemented");
  }
};
