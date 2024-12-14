import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { OnBoarding } from "./modules/OnBoarding";
import { Store } from "./lib/store";
import { Embedding } from "./lib/embedding";
import { ProgressCallback } from "@huggingface/transformers";

import "./App.css";
import { useExecuteMigrations } from "./hooks/useExecuteMigrations";
import { Channel, invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/components/Button";

const channel = new Channel<any>();

channel.onmessage = (response) => {
  console.log(response, "response");
};

function App() {
  const [progress, setProgress] = useState("");
  const [embedModelLoaded, setEmbedModelLoaded] = useState(true);

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

    // Embedding.loadModel(onEmbedProgress);
  }, [onEmbedProgress]);

  const onTest = async () => {
    const result = await invoke("download", {
      url: "https://huggingface.co/jinaai/jina-embeddings-v2-base-code/resolve/main/onnx/model_quantized.onnx",
      onProgress: channel,
    });
  };

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
      <Button onClick={onTest}>Test</Button>
    </main>
  );
}

export default App;
