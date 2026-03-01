use std::{fs, path::Path};

fn main() {
    dotenv::dotenv().ok();

    if let Ok(vk_shared_api_base) = std::env::var("VK_SHARED_API_BASE") {
        println!("cargo:rustc-env=VK_SHARED_API_BASE={}", vk_shared_api_base);
    }

    // Create frontend/dist directory if it doesn't exist
    let dist_path = Path::new("../../frontend/dist");
    if !dist_path.exists() {
        println!("cargo:warning=Creating dummy frontend/dist directory for compilation");
        fs::create_dir_all(dist_path).unwrap();

        // Create a dummy index.html
        let dummy_html = r#"<!DOCTYPE html>
<html><head><title>Build frontend first</title></head>
<body><h1>Please build the frontend</h1></body></html>"#;

        fs::write(dist_path.join("index.html"), dummy_html).unwrap();
    }
}
