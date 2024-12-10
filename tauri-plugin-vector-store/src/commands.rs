use tauri::{command, AppHandle, Manager, Runtime};

use crate::VectorStore;

#[command]
pub(crate) async fn version<R: Runtime>(app: AppHandle<R>) -> (String, String) {
    // implement command logic here
    let store = app.state::<VectorStore>();
    let result = store.info().unwrap();
    result
}

#[command]
pub(crate) async fn test<R: Runtime>(app: AppHandle<R>, vector: Vec<f32>) -> String {
    let store = app.state::<VectorStore>();
    let result = store.test(vector).unwrap();
    result
}
