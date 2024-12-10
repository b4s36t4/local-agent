use tauri::{command, AppHandle, Manager, Runtime};

use crate::VectorStore;

#[command]
pub(crate) async fn version<R: Runtime>(app: AppHandle<R>) -> (String, String) {
    // implement command logic here
    let store = app.state::<VectorStore>();
    let result = store.info().unwrap();
    result
}
