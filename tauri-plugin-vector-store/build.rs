const COMMANDS: &[&str] = &[
    "version",
    "test",
    "query_sql",
    "execute_sql",
    "download",
    "embed",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
