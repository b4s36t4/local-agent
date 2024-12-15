use embed::Embed;
use rusqlite::{ffi::sqlite3_auto_extension, Batch, Connection, Error, Result};
use serde::Deserialize;
use sqlite_vec::sqlite3_vec_init;
use std::{fs, path::Path, sync::Mutex};
use tauri::{
    path::BaseDirectory,
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};
use zerocopy::IntoBytes;

mod commands;
mod embed;
mod error;

pub struct VectorStore {
    connection: Mutex<Connection>,
    embed: Mutex<Embed>,
}

impl VectorStore {
    pub fn new<P: AsRef<Path>>(path: P, model_path: P) -> Self {
        unsafe {
            sqlite3_auto_extension(Some(std::mem::transmute(sqlite3_vec_init as *const ())));
        }
        let db =
            Connection::open(path.as_ref().to_path_buf()).expect("Unable to open the database");

        let _ = db.execute("PRAGMA foreign_keys = ON;", []);
        let embed = Embed::new(model_path).unwrap();
        Self {
            connection: Mutex::new(db),
            embed: Mutex::new(embed),
        }
    }

    pub fn info(&self) -> Result<(String, String)> {
        let connection = self.connection.lock().unwrap();
        let (sqlite_version, vec_version): (String, String) =
            connection.query_row("select sqlite_version(), vec_version()", [], |result| {
                Ok((result.get(0)?, result.get(1)?))
            })?;

        return Ok((sqlite_version, vec_version));
    }

    pub fn test(&self, vector: Vec<f32>) -> Result<String> {
        let connection = self.connection.lock().unwrap();
        let result: String =
            connection.query_row("select vec_to_json(?)", [vector.as_bytes()], |result| {
                Ok(result.get(0)?)
            })?;
        Ok(result)
    }

    pub fn query_sql(&self, sql: String) -> Result<Vec<String>, Error> {
        let connection = self.connection.lock().unwrap();
        let mut stmt = connection.prepare(&sql)?;

        // Execute the query and collect table names
        let table_names = stmt
            .query_map([], |row| {
                row.get(0) // The table name is the first column
            })?
            .collect::<Result<Vec<String>>>()?;

        Ok(table_names)
    }

    pub fn execute_sql(&self, sql: String, batch: Option<bool>) -> Result<usize, Error> {
        let connection = self.connection.lock().unwrap();
        if batch.ok_or(false) == Ok(true) {
            let mut batch = Batch::new(&connection, &sql);
            while let Some(mut stmt) = batch.next()? {
                stmt.execute([])?;
            }
            return Ok(0);
        }
        let statement = connection.prepare(&sql.as_str());
        if statement.is_err() {
            return Err(statement.err().unwrap());
        }
        let mut binding = statement.unwrap();
        let exection_result = binding.execute([]);
        return Ok(exection_result.ok().unwrap());
    }
}

// Define the plugin config
#[derive(Deserialize, Debug)]
pub struct Config {
    path: String,
}

pub fn init<R: Runtime>() -> TauriPlugin<R, Config> {
    // Make the plugin config optional
    // by using `Builder::<R, Option<Config>>` instead
    Builder::<R, Config>::new("vector-store")
        .invoke_handler(tauri::generate_handler![
            commands::version,
            commands::test,
            commands::query_sql,
            commands::execute_sql,
            embed::download,
            embed::embed
        ])
        .setup(|app, api| {
            let path = &api.config().path;
            let path_buf = app.path().resolve(path, BaseDirectory::AppData).unwrap();
            fs::create_dir_all(path_buf.clone().parent().unwrap())?;
            let model_path = app
                .path()
                .resolve("onnx/model_quantized.onnx", BaseDirectory::AppData)
                .unwrap();
            app.manage(VectorStore::new(path_buf, model_path));

            Ok(())
        })
        .build()
}
