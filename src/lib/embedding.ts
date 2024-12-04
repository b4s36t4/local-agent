import {
  pipeline,
  FeatureExtractionPipeline,
  ProgressCallback,
} from "@huggingface/transformers";

const MODEL_REPO = "jinaai/jina-embeddings-v2-base-code";

export class Embedding {
  static _pipeline: FeatureExtractionPipeline;
  static async loadModel(callback?: ProgressCallback) {
    if (!this._pipeline) {
      this._pipeline = await pipeline("feature-extraction", MODEL_REPO, {
        device: "auto",
        dtype: "q8",
        progress_callback: callback,
      });
    }
    return this._pipeline;
  }

  static async embed(input: string) {
    this._pipeline(input, { quantize: true, pooling: "mean" });
  }
}
