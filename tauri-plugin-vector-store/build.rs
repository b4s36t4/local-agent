const COMMANDS: &[&str] = &["version", "test", "query_sql","execute_sql"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
