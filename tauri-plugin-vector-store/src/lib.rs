use rusqlite::{ffi::sqlite3_auto_extension, Connection, Result};
use serde::Deserialize;
use sqlite_vec::sqlite3_vec_init;
use std::{fs, path::Path, sync::Mutex};
use tauri::{
    path::BaseDirectory,
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;

pub struct VectorStore {
    connection: Mutex<Connection>,
}

impl VectorStore {
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        unsafe {
            sqlite3_auto_extension(Some(std::mem::transmute(sqlite3_vec_init as *const ())));
        }
        let db =
            Connection::open(path.as_ref().to_path_buf()).expect("Unable to open the database");
        Self {
            connection: Mutex::new(db),
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
        .invoke_handler(tauri::generate_handler![commands::version])
        .setup(|app, api| {
            println!("{:?}", api.config());
            let path = &api.config().path;
            let path_buf = app.path().resolve(path, BaseDirectory::AppData).unwrap();
            fs::create_dir_all(path_buf.clone().parent().unwrap())?;
            app.manage(VectorStore::new(path_buf));
            Ok(())
        })
        .build()
}
