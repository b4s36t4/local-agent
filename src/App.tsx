import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { OnBoarding } from "./modules/OnBoarding";
import { Store } from "./lib/store";
import { Embedding } from "./lib/embedding";
import { useExecuteMigrations } from "./hooks/useExecuteMigrations";
import { Channel } from "@tauri-apps/api/core";
import { ProgressCallback } from "@huggingface/transformers";

import "./App.css";

const channel = new Channel<any>();

channel.onmessage = (response) => {
  console.log(response, "response");
};

function App() {
  const [progress, setProgress] = useState("");
  const [embedModelLoaded, setEmbedModelLoaded] = useState(false);

  const { run } = useExecuteMigrations();

  const onEmbedProgress: ProgressCallback = useCallback((info) => {
    if (info.progress) {
      setProgress(info.progress.toFixed(2).toString());
    }
    if ((info as any).status === "ready") {
      setEmbedModelLoaded((prev) => {
        if (!prev) {
          // Bad Practice
          toast("Embedding model loaded!");
          run();
          return true;
        }
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    Store.loadStore();
    if (embedModelLoaded) {
      return;
    }

    Embedding.loadModel(onEmbedProgress);
  }, [onEmbedProgress, embedModelLoaded]);

  return (
    <main className="container w-full h-screen mx-auto overflow-scroll">
      {!embedModelLoaded && (
        <div className="text-base flex items-center justify-center h-screen font-semibold flex-col">
          <p>Embed model loading</p>
          <p>{progress}</p>
        </div>
      )}
      {embedModelLoaded && <OnBoarding />}
      <Toaster position="top-right" />
    </main>
  );
}

export default App;
