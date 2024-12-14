use tauri::{command, AppHandle, Manager, Runtime};

use crate::error::{Error, Result};
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

#[command]
pub(crate) async fn query_sql<R: Runtime>(app: AppHandle<R>, sql: String) -> Result<Vec<String>> {
    let store: tauri::State<'_, VectorStore> = app.state::<VectorStore>();
    let result = store.query_sql(sql);

    if result.is_ok() {
        return Ok(result.ok().unwrap());
    }

    return Err(Error::SQLFailed(result.err().unwrap()));
}

#[command]
pub(crate) async fn execute_sql<R: Runtime>(
    app: AppHandle<R>,
    sql: String,
    is_batch: Option<bool>,
) -> Result<usize> {
    let store = app.state::<VectorStore>();
    let result = store.execute_sql(sql, is_batch);

    if result.is_ok() {
        return Ok(result.ok().unwrap());
    }

    return Err(Error::SQLFailed(result.err().unwrap()));
}
