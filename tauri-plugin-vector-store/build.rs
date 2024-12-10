const COMMANDS: &[&str] = &["version"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
