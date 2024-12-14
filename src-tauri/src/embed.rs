use curl::{
    easy::{self},
    multi::Multi,
};
use serde::Serialize;
use std::{fs, io::Write};
use tauri::{ipc::Channel, path, AppHandle, Manager, Result, Runtime};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadEvent {
    url: String,
    total_size: f64,
    downloaded: f64,
}

#[tauri::command]
pub async fn download<R: Runtime>(
    app: AppHandle<R>,
    url: String,
    on_progress: Channel<DownloadEvent>,
) -> Result<()> {
    let mut easy_instance = easy::Easy::new();

    easy_instance.url(url.as_str()).unwrap();

    let desination = app
        .path()
        .resolve("onnx/model_quantized.onnx", path::BaseDirectory::AppData)
        .unwrap();

    fs::create_dir_all(desination.clone().parent().unwrap())?;
    let mut file = std::fs::File::create_new(desination).unwrap();

    easy_instance.follow_location(true);
    easy_instance.progress(true).unwrap();
    easy_instance
        .progress_function(move |total, download, _, _| {
            on_progress
                .send(DownloadEvent {
                    downloaded: download,
                    total_size: total,
                    url: url.clone(),
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

#[tauri::command]
pub fn embed<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    Ok(())
}
