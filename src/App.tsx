import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { OnBoarding } from "./modules/OnBoarding";
import { Store } from "./lib/store";
import { Embedding } from "./lib/embedding";
import { ProgressCallback } from "@huggingface/transformers";

import "./App.css";

function App() {
  const [progress, setProgress] = useState("");
  const [embedModelLoaded, setEmbedModelLoaded] = useState(false);

  const onEmbedProgress: ProgressCallback = useCallback((info) => {
    if (info.progress) {
      setProgress(info.progress.toString());
    }
    if ((info as any).status === "ready") {
      setEmbedModelLoaded((prev) => {
        if (!prev) {
          toast("Embedding model loaded!");
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
  }, [onEmbedProgress]);

  return (
    <main className="container mx-auto">
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
