mod build;

use build::{build_scripts, build_styles};
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    let mode = args.get(1).map(|s| s.as_str()).unwrap_or("build");

    if let Err(e) = build_styles() {
        eprintln!("\u{274C} Styles failed: {e}");
        std::process::exit(1);
    }

    if let Err(e) = build_scripts(mode == "watch") {
        eprintln!("\u{274C} Scripts failed: {e}");
        std::process::exit(1);
    }

    println!("\u{2705} Build ({mode}) complete.");
}
