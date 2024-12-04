import { useCallback } from "react";
import { Button } from "../ui/components/Button";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";
import { toast } from "react-hot-toast";
import { Store } from "../lib/store";
import { STORE_KEYS } from "../lib/const";
import { traverseRepo } from "../lib/file";

export const OnBoarding = () => {
  const onSelect = useCallback(async () => {
    try {
      const folder = await open({ directory: true, multiple: false });
      if (!folder) {
        toast.error("Please select a folder");
        return;
      }
      const folderDetails = await readDir(folder);
      Store.set(STORE_KEYS.REPO, {
        [`${folder}`]: folderDetails,
      });
      traverseRepo(folder);
    } catch (error) {
      toast.error(
        (error as any)?.message ?? "Please select the folder again",
        {}
      );
    }
  }, []);

  return (
    <div className="w-full h-screen flex-col flex items-center justify-center">
      <p>Please select a Repository to index file</p>
      <Button onClick={onSelect} className="my-4">
        Select
      </Button>
    </div>
  );
};
