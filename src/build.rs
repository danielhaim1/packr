use std::fs;
use std::process::Command;
use lightningcss::stylesheet::{ParserOptions, PrinterOptions, StyleSheet};
use grass;

pub fn build_styles() -> Result<(), String> {
    let input = "src/scss/app.scss";
    let output = "dist/app.css";

    let css = grass::from_path(input, &grass::Options::default())
        .map_err(|e| format!("SCSS compile error: {e}"))?;

    let sheet = StyleSheet::parse(&css, ParserOptions::default())
        .map_err(|e| format!("CSS parse error: {e}"))?;

    let result = sheet.to_css(PrinterOptions::default())
        .map_err(|e| format!("CSS print error: {e}"))?;

    fs::create_dir_all("dist").map_err(|e| format!("Failed to create output directory: {e}"))?;
    fs::write(output, result.code).map_err(|e| format!("Failed to write CSS: {e}"))?;

    Ok(())
}

pub fn build_scripts(watch: bool) -> Result<(), String> {
    let mut cmd = Command::new("esbuild");

    cmd.arg("src/js/app.js")
        .args([
            "--bundle",
            "--minify",
            "--minify-syntax",
            "--minify-whitespace",
            "--target=es2020",
            "--outfile=dist/app.js",
            "--legal-comments=none",
            "--sourcemap",
        ]);

    if watch {
        cmd.arg("--watch");
    }

    let status = cmd.status().map_err(|e| format!("Failed to run esbuild: {e}"))?;

    if !status.success() {
        return Err("esbuild failed".into());
    }

    Ok(())
}


