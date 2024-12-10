const COMMANDS: &[&str] = &["version","test"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
