// * ! ==================================================
// * ! Main script for Packr
// * ! ==================================================

mod build;

use build::{build_scripts, build_styles, load_config};
use std::env;

fn main() {
    // * Entry point for Packr build process
    // * Handles config loading, watch mode flag, and dispatches style/script builds

    let args: Vec<String> = env::args().collect();

    // * Get config path from --config flag or fallback to default
    let mut config_path = ".packr.json";
    let mut i = 1;
    while i < args.len() {
        if args[i].as_str() == "--config" && i + 1 < args.len() {
            config_path = &args[i + 1];
            i += 2;
            continue;
        }
        i += 1;
    }

    // * Check if `--watch` flag is present
    let watch_mode = args.iter().any(|arg| arg == "--watch");

    // * Load configuration from file
    let (config, config_dir) = match load_config(config_path) {
        Ok(result) => result,
        Err(e) => {
            eprintln!("\u{274C} Failed to load configuration: {e}");
            std::process::exit(1);
        }
    };

    // * Compile SCSS to CSS
    if let Err(e) = build_styles(&config, &config_dir) {
        eprintln!("\u{274C} Styles failed: {e}");
        std::process::exit(1);
    }

    // * Bundle JavaScript with optional watch mode
    if let Err(e) = build_scripts(&config, &config_dir, watch_mode) {
        eprintln!("\u{274C} Scripts failed: {e}");
        std::process::exit(1);
    }

    // * Build complete message
    println!(
        "\u{2705} Build ({}) complete.",
        if watch_mode { "watch" } else { "single" }
    );
}
