import { join } from "@tauri-apps/api/path";
import { STORE_KEYS } from "./const";
import { Store } from "./store";
import { readDir, readFile } from "@tauri-apps/plugin-fs";
import { cat } from "@huggingface/transformers";
import { path } from "@tauri-apps/api";

const decoder = new TextDecoder();

const SKIP_FILES = ["png", "jpeg", "jpg", "webp", "gif"];
const FOLDERS_TO_SKIP = ["node_modules", ".vscode", "public", "build", "dist"];
const FILES_TO_SKIP = [
  "package-lock.json",
  "bun.lockb",
  "pnpm-lock.yaml",
  "yarn-lock.yaml",
  "Cargo.lock",
];

export const indexFile = async (file: string) => {
  if (FILES_TO_SKIP.includes(await path.basename(file))) {
    return;
  }
  try {
    // const fileContent = await readFile(file);
    const extension = file.split(".").at(-1);
    if (SKIP_FILES.includes(extension ?? "")) {
      return;
    }
    // const _content = decoder.decode(fileContent);
    // console.log(_content);
    console.log("Embed done for", file);
  } catch (err) {
    console.log(err);
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
      const path = await join(folder, entry.name)
      if (entry.isFile) {
        await indexFile(path);
      }
      if (entry.isDirectory) {
        console.log("Indexing folder", path);
        await indexFolder(path);
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

  console.log(repo, indexes);

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
