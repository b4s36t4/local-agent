import {
  pipeline,
  FeatureExtractionPipeline,
  ProgressCallback,
} from "@huggingface/transformers";
import { appDataDir, resolve } from "@tauri-apps/api/path";

const MODEL_REPO = "jinaai/jina-embeddings-v2-base-code";

const MODEL_PATH = await resolve(await appDataDir(), "models", "onnx");
export class Embedding {
  static _pipeline: FeatureExtractionPipeline;
  static async loadModel(callback?: ProgressCallback) {
    if (!this._pipeline) {
      this._pipeline = await pipeline("feature-extraction", MODEL_REPO, {
        device: "auto",
        dtype: "q8",
        progress_callback: callback,
        cache_dir: MODEL_PATH,
      });
    }
    return this._pipeline;
  }

  static async embed(input: string) {
    return await this._pipeline([input], {
      pooling: "mean",
    });
  }
}
