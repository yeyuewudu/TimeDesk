mod llm;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![llm::analyze_text_with_llm])
        .run(tauri::generate_context!())
        .expect("error while running TimeDesk");
}
