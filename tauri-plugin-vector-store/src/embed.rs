use curl::easy;
use ndarray::{Array2, Array3, ArrayView, Axis, Ix3};
use ort::{session::Session, Error};
use serde::Serialize;
use std::{fs, io::Write, path::Path, sync::Mutex};
use tauri::{ipc::Channel, path, AppHandle, Manager, Result, Runtime};
use tokenizers::tokenizer::Tokenizer;

use crate::VectorStore;

#[derive(Clone, Serialize)]
enum DownloadStatus {
    COMPLETED,
    DOWNLOADING,
    EXISTS,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadEvent {
    url: String,
    total_size: f64,
    downloaded: f64,
    status: DownloadStatus,
}

#[tauri::command]
pub async fn download<R: Runtime>(
    app: AppHandle<R>,
    url: String,
    on_progress: Channel<DownloadEvent>,
) -> Result<()> {
    let mut easy_instance = easy::Easy::new();

    easy_instance.url(url.as_str()).unwrap();

    let destination = app
        .path()
        .resolve("onnx/model_quantized.onnx", path::BaseDirectory::AppData)
        .unwrap();

    if destination.exists() {
        on_progress
            .send(DownloadEvent {
                downloaded: 100.0,
                total_size: 100.0,
                url: url.clone(),
                status: DownloadStatus::EXISTS,
            })
            .unwrap();
        return Ok(());
    }
    fs::create_dir_all(destination.clone().parent().unwrap())?;
    let mut file = std::fs::File::create_new(destination).unwrap();

    easy_instance.follow_location(true).unwrap();
    easy_instance.progress(true).unwrap();
    easy_instance
        .progress_function(move |total, downloaded, _, _| {
            let mut status = DownloadStatus::DOWNLOADING;
            if total == downloaded {
                status = DownloadStatus::COMPLETED;
            }
            on_progress
                .send(DownloadEvent {
                    downloaded,
                    total_size: total,
                    url: url.clone(),
                    status,
                })
                .unwrap();
            true
        })
        .unwrap();

    let mut transfer = easy_instance.transfer();
    transfer
        .write_function(|chunk| {
            file.write_all(chunk).unwrap();
            Ok(chunk.len())
        })
        .unwrap();

    transfer.perform().unwrap();
    Ok(())
}

fn get_chat_template(msg: String) -> String {
    return format!("<s><|user|>\n{msg}<|end|>\n<|assistant|>\n", msg = msg);
}

pub struct Embed {
    tokenizer: Mutex<Tokenizer>,
    model: Mutex<Session>,
}

impl Embed {
    pub fn new<P: AsRef<Path>>(model_path: P) -> Result<Self> {
        if !model_path.as_ref().exists() {
            eprintln!("Model is not yet downloaded, please check again")
        }
        let tokenizer =
            Tokenizer::from_pretrained("jinaai/jina-embeddings-v2-base-code", None).unwrap();
        let model = Session::builder()
            .unwrap()
            .commit_from_file(model_path)
            .unwrap();
        Ok(Self {
            tokenizer: Mutex::new(tokenizer),
            model: Mutex::new(model),
        })
    }
}

fn get_text_embedding(
    model: &Session,
    input_ids: &Array2<i64>,
    attention_mask: &Array2<i64>,
) -> std::result::Result<Array3<f32>, Error> {
    let model_inputs = ort::inputs![
        "input_ids" => input_ids.to_owned(),
        "attention_mask" => attention_mask.clone()
    ]?;
    let outputs = model.run(model_inputs)?;
    let inputs_embeds_view: ArrayView<f32, _> =
        outputs["last_hidden_state"].try_extract_tensor::<f32>()?;
    println!("{:?}", inputs_embeds_view);
    let inputs_embeds = inputs_embeds_view
        .into_dimensionality::<Ix3>()
        .unwrap()
        .to_owned();
    Ok(inputs_embeds)
}

// **
// Example Usage of this
//   const onTest = async () => {
// const result = await invoke(COMMANDS.DOWNLOAD, {
//     url: "https://huggingface.co/jinaai/jina-embeddings-v2-base-code/resolve/main/onnx/model_quantized.onnx",
//     onProgress: channel,
//   });

//   const embed = (await invoke(COMMANDS.EMBED, {
//     input: "Hello, world!",
//   })) as any;

//   const embed2 = (await invoke(COMMANDS.EMBED, {
//     input: "mahesh",
//   })) as any;

//   console.log(cos_sim(embed, embed2));
// };

#[tauri::command]
pub async fn embed<R: Runtime>(app: AppHandle<R>, input: String) -> Result<Vec<f32>> {
    println!("[Warning]: Giving wrong results, don't use");
    let binding = app.state::<VectorStore>();
    let app_state = binding.embed.lock().unwrap();
    let tokenizer = app_state.tokenizer.lock().unwrap();
    let model = app_state.model.lock().unwrap();

    println!("{:?} - inputs", model.inputs);

    let msg_template = get_chat_template(input);
    let encoding = tokenizer
        .encode(msg_template, false)
        .map_err(|_| "Unable to tokenize input")
        .unwrap();

    println!("{:?}", encoding);
    let input_ids: Vec<i64> = encoding.get_ids().iter().map(|&id| id as i64).collect();
    let input_ids: Array2<i64> = Array2::from_shape_vec((1, input_ids.len()), input_ids).unwrap();
    let attention_mask: Vec<i64> = encoding
        .get_attention_mask()
        .iter()
        .map(|&mask| mask as i64)
        .collect();
    let attention_mask: Array2<i64> =
        Array2::from_shape_vec((1, attention_mask.len()), attention_mask).unwrap();
    let embeddings: Array3<f32> = get_text_embedding(&model, &input_ids, &attention_mask).unwrap();
    let pooled_embedding = embeddings.mean_axis(Axis(1)).unwrap().flatten().to_vec();

    Ok(pooled_embedding)
}
