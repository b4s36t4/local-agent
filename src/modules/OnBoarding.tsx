import { useCallback } from "react";
import { BadgePlus } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";
import { toast } from "react-hot-toast";
import { Store } from "../lib/store";
import { STORE_KEYS } from "../lib/const";
import { traverseRepo } from "../lib/file";
import { Dropdown } from "../ui/components/Dropdown";

export const OnBoarding = () => {
  const onAddRepo = useCallback(async () => {
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
    <div className="h-screen flex">
      <div className="w-3/12 border-r-2 border-gray-200 p-2">
        <div className="flex justify-between items-center font-semibold text-lg mt-4">
          <p>Your Conversations</p>
          <Dropdown
            items={[
              { id: "new-chat", label: "New Chat", className: "mb-2" },
              { id: "index-codebase", label: "Add Repo", onClick: onAddRepo },
            ]}
          >
            <BadgePlus className="dark:text-gray-200" />
          </Dropdown>
        </div>
        <div className="mt-6">
          <p className="text-center">No Previous conversations</p>
        </div>
      </div>
      <div className="w-9/12 p-2">
        <p>Chat Area</p>
      </div>
    </div>
  );
};
