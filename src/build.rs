// * ! ==================================================
// * ! Build script for Packr
// * ! ==================================================

use colored::*;
use lightningcss::stylesheet::{ParserOptions, PrinterOptions, StyleSheet};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

// * Default configuration structure loaded from packr.json
#[derive(Debug, serde::Deserialize)]
pub struct Config {
    pub scss_input: String,
    pub scss_output: String,
    pub js_input: String,
    pub js_output: String,
    #[serde(default)]
    pub css_destination: Option<String>,
    #[serde(default)]
    pub js_destination: Option<String>,
    #[serde(default = "default_minify")]
    pub minify: bool,
    #[serde(default = "default_target")]
    pub target: String,
    #[serde(default = "default_verbose")]
    pub verbose: bool,
    #[serde(default = "default_sourcemap")]
    pub sourcemap: bool,
    #[serde(default = "default_format")]
    pub format: String,
    #[serde(default = "default_eslint")]
    pub eslint: bool,
    #[serde(default)]
    pub eslint_config: Option<String>,
}

// * Error handling utilities
struct ErrorContext {
    context: String,
    details: Option<String>,
}

impl ErrorContext {
    fn new(context: &str) -> Self {
        Self {
            context: context.to_string(),
            details: None,
        }
    }

    fn with_details(mut self, details: &str) -> Self {
        self.details = Some(details.to_string());
        self
    }

    fn format(&self) -> String {
        format!(
            "{}: {}",
            self.context,
            self.details
                .as_ref()
                .unwrap_or(&"Unknown error".to_string())
        )
    }
}

// * Helper function to handle errors with context
fn handle_error<T, E>(result: Result<T, E>, context: &str) -> Result<T, String>
where
    E: std::fmt::Display,
{
    result.map_err(|e| format!("{}: {}", context, e))
}

// * Load and parse packr configuration JSON
pub fn load_config(config_path: &str) -> Result<(Config, PathBuf), String> {
    log_info("Loading config", &format!("from: {}", config_path));

    let config_str = handle_error(
        fs::read_to_string(config_path),
        "Failed to read config file",
    )?;

    let mut config: Config = handle_error(
        serde_json::from_str(&config_str),
        "Failed to parse config file",
    )?;

    // Override config with environment variables if they exist
    if let Ok(val) = env::var("PACKR_MINIFY") {
        config.minify = val == "true";
    }

    if let Ok(val) = env::var("PACKR_TARGET") {
        config.target = val;
    }

    if let Ok(val) = env::var("PACKR_VERBOSE") {
        config.verbose = val == "true";
    }

    if let Ok(val) = env::var("PACKR_SOURCEMAP") {
        config.sourcemap = val == "true";
    }

    if let Ok(val) = env::var("PACKR_FORMAT") {
        config.format = val;
    }

    if let Ok(val) = env::var("PACKR_ESLINT") {
        config.eslint = val == "true";
    }

    if let Ok(val) = env::var("PACKR_ESLINT_CONFIG") {
        config.eslint_config = Some(val);
    }

    let config_dir = Path::new(config_path)
        .parent()
        .ok_or_else(|| ErrorContext::new("Failed to get config directory").format())?
        .to_path_buf();

    log_info("Config loaded", &format!("{:?}", config));
    Ok((config, config_dir))
}

// * Helper function to resolve paths
fn resolve_path(base: &Path, path: &str) -> PathBuf {
    base.join(path)
}

// * Logging helper functions
fn log_info(context: &str, message: &str) {
    println!("{} {}", context.blue().bold(), message);
}

fn log_success(context: &str, message: &str) {
    println!("{} {}", context.green().bold(), message);
}

fn log_error(context: &str, message: &str) {
    eprintln!("{} {}", context.red().bold(), message);
}

fn log_warning(context: &str, message: &str) {
    println!("{} {}", context.yellow().bold(), message);
}

// * Structure to track ESLint warnings across builds
#[derive(Default)]
struct ESLintSummary {
    warnings: HashMap<String, Vec<String>>,
}

impl ESLintSummary {
    fn add_warning(&mut self, file: String, warning: String) {
        self.warnings.entry(file).or_default().push(warning);
    }

    fn display(&self) {
        if self.warnings.is_empty() {
            return;
        }

        println!("\nESLint Warning Summary:");
        println!("=====================");

        for (file, warnings) in &self.warnings {
            println!("\nFile: {}", file);
            println!("Warnings:");
            for warning in warnings {
                println!("  {}", warning);
            }
        }
        println!("\nTotal files with warnings: {}", self.warnings.len());
        println!(
            "Total warnings: {}",
            self.warnings.values().map(|w| w.len()).sum::<usize>()
        );
    }
}

// * Compile SCSS using `grass`, optionally minify with `lightningcss`
pub fn build_styles(config: &Config, config_dir: &Path) -> Result<(), String> {
    log_info("Building styles", &format!("from: {}", config.scss_input));

    let input = resolve_path(config_dir, &config.scss_input);
    let output = config_dir.join(&config.scss_output);

    if !input.exists() {
        return Err(ErrorContext::new("SCSS input file not found")
            .with_details(&format!("{}", input.display()))
            .format());
    }

    let css = handle_error(
        grass::from_path(&input, &grass::Options::default()),
        "SCSS compilation failed",
    )?;

    let parser_options = ParserOptions {
        filename: input.to_string_lossy().to_string(),
        ..Default::default()
    };

    let sheet = handle_error(
        StyleSheet::parse(&css, parser_options),
        "CSS parsing failed",
    )?;

    if let Some(parent) = output.parent() {
        handle_error(
            fs::create_dir_all(parent),
            "Failed to create output directory",
        )?;
    }

    // Generate non-minified version
    let printer_options = PrinterOptions {
        minify: false,
        ..Default::default()
    };
    let result = sheet.to_css(printer_options).map_err(|e| {
        let error_msg = format!("CSS print error: {e}");
        log_error("Error", &error_msg);
        error_msg
    })?;

    fs::write(&output, &result.code).map_err(|e| {
        let error_msg = format!("Failed to write CSS: {e}");
        log_error("Error", &error_msg);
        error_msg
    })?;

    if config.sourcemap {
        let map_path = output.with_extension("css.map");
        let map_content = format!(
            "{{\"version\":3,\"file\":\"{}\",\"sources\":[\"{}\"],\"names\":[],\"mappings\":\"\"}}",
            output.file_name().unwrap().to_string_lossy(),
            input.file_name().unwrap().to_string_lossy()
        );
        fs::write(&map_path, map_content).map_err(|e| {
            let error_msg = format!("Failed to write CSS sourcemap: {e}");
            log_error("Error", &error_msg);
            error_msg
        })?;
    }

    let min_output = if config.minify {
        let min_path = output.with_file_name(format!(
            "{}.min{}",
            output.file_stem().unwrap().to_string_lossy(),
            output
                .extension()
                .map(|ext| format!(".{}", ext.to_string_lossy()))
                .unwrap_or_default()
        ));

        let printer_options = PrinterOptions {
            minify: true,
            ..Default::default()
        };
        let result = sheet.to_css(printer_options).map_err(|e| {
            let error_msg = format!("CSS print error: {e}");
            log_error("Error", &error_msg);
            error_msg
        })?;

        fs::write(&min_path, &result.code).map_err(|e| {
            let error_msg = format!("Failed to write minified CSS: {e}");
            log_error("Error", &error_msg);
            error_msg
        })?;

        if config.sourcemap {
            let map_path = min_path.with_extension("css.map");
            let map_content = format!(
                "{{\"version\":3,\"file\":\"{}\",\"sources\":[\"{}\"],\"names\":[],\"mappings\":\"\"}}",
                min_path.file_name().unwrap().to_string_lossy(),
                input.file_name().unwrap().to_string_lossy()
            );
            fs::write(&map_path, map_content).map_err(|e| {
                let error_msg = format!("Failed to write minified CSS sourcemap: {e}");
                log_error("Error", &error_msg);
                error_msg
            })?;
        }

        Some(min_path)
    } else {
        None
    };

    if config.verbose {
        log_success("CSS", &format!("written to: {}", output.display()));
        if let Some(ref min_path) = min_output {
            log_success(
                "CSS",
                &format!("minified version written to: {}", min_path.display()),
            );
        }
    }

    // * Copy result to alternate destination if defined
    if let Some(dest) = &config.css_destination {
        let dest_dir = config_dir.join(dest);
        let dest_path = dest_dir.join(Path::new(&config.scss_output).file_name().unwrap());
        let dest_min_path = if config.minify {
            Some(
                dest_dir.join(Path::new(&config.scss_output).with_file_name(format!(
                        "{}.min{}",
                        Path::new(&config.scss_output)
                            .file_stem()
                            .unwrap()
                            .to_string_lossy(),
                        Path::new(&config.scss_output)
                            .extension()
                            .map(|ext| format!(".{}", ext.to_string_lossy()))
                            .unwrap_or_default()
                    ))),
            )
        } else {
            None
        };

        // Create destination directory
        handle_error(
            fs::create_dir_all(&dest_dir),
            "Failed to create CSS destination folder",
        )?;

        // Copy non-minified version
        fs::write(&dest_path, &result.code).map_err(|e| {
            let error_msg = format!("Failed to copy CSS to destination: {e}");
            log_error("Error", &error_msg);
            error_msg
        })?;

        // Copy minified version if it exists
        if let Some(ref min_path) = dest_min_path {
            if let Some(ref source_min) = min_output {
                if let Ok(min_content) = fs::read(source_min) {
                    // Create parent directory for minified file if needed
                    if let Some(parent) = min_path.parent() {
                        handle_error(
                            fs::create_dir_all(parent),
                            "Failed to create minified CSS destination folder",
                        )?;
                    }
                    fs::write(min_path, min_content).map_err(|e| {
                        let error_msg = format!("Failed to copy minified CSS to destination: {e}");
                        log_error("Error", &error_msg);
                        error_msg
                    })?;
                }
            }
        }

        if config.sourcemap {
            let map_path = output.with_extension("css.map");
            let dest_map_path = dest_path.with_extension("css.map");
            if let Ok(map_content) = fs::read(&map_path) {
                fs::write(&dest_map_path, map_content).map_err(|e| {
                    let error_msg = format!("Failed to copy CSS sourcemap to destination: {e}");
                    log_error("Error", &error_msg);
                    error_msg
                })?;
            }
        }

        if config.verbose {
            log_success("CSS", &format!("copied to: {}", dest_path.display()));
            if let Some(ref min_path) = dest_min_path {
                log_success(
                    "CSS",
                    &format!("minified version copied to: {}", min_path.display()),
                );
            }
        }
    }

    log_success("Styles", "built successfully");
    Ok(())
}

// * Run ESLint on JavaScript files
fn run_eslint(
    config: &Config,
    config_dir: &Path,
    input: &Path,
    summary: &mut ESLintSummary,
) -> Result<(), String> {
    if !config.eslint {
        return Ok(());
    }

    log_info("Running", "ESLint");

    // Validate ESLint config path
    let eslint_config_path = if let Some(ref custom_path) = config.eslint_config {
        if custom_path.contains("..") || Path::new(custom_path).is_absolute() {
            return Err("Invalid ESLint config path: potential traversal attempt".to_string());
        }
        config_dir.join(custom_path)
    } else {
        config_dir.join(".eslintrc.json")
    };

    let eslint_path = eslint_config_path.canonicalize().map_err(|e| {
        let error_msg = format!("Failed to resolve ESLint config path: {e}");
        log_error("Error", &error_msg);
        error_msg
    })?;

    if !eslint_path.starts_with(config_dir) {
        let error_msg =
            "ESLint config path points outside the allowed config directory".to_string();
        log_error("Error", &error_msg);
        return Err(error_msg);
    }

    let mut cmd = Command::new("npx");
    cmd.arg("eslint")
        .arg("--max-warnings=0")
        .arg("--format=json")
        .arg("--no-eslintrc")
        .arg("-c")
        .arg(eslint_path.as_os_str())
        .arg(input.as_os_str());

    if config.verbose {
        log_info("ESLint", "checking JavaScript files");
    }

    let output = cmd.output().map_err(|e| {
        let error_msg = format!("Failed to run ESLint: {e}");
        log_error("Error", &error_msg);
        error_msg
    })?;

    if !output.stdout.is_empty() {
        let json_str = String::from_utf8_lossy(&output.stdout);
        if let Ok(json) = serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
            for file in json {
                if let Some(file_path) = file.get("filePath").and_then(|p| p.as_str()) {
                    if let Some(messages) = file.get("messages").and_then(|m| m.as_array()) {
                        for message in messages {
                            if let (Some(rule_id), Some(message), Some(line), Some(column)) = (
                                message.get("ruleId").and_then(|r| r.as_str()),
                                message.get("message").and_then(|m| m.as_str()),
                                message.get("line").and_then(|l| l.as_i64()),
                                message.get("column").and_then(|c| c.as_i64()),
                            ) {
                                let warning = format!(
                                    "Line {}, Column {}: {} - {}",
                                    line, column, rule_id, message
                                );
                                summary.add_warning(file_path.to_string(), warning);
                            }
                        }
                    }
                }
            }
        }
    }

    if output.status.code() == Some(1) {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        if !error_msg.contains("too many warnings") {
            log_error("ESLint", &error_msg);
            return Err(format!("ESLint found errors:\n{}", error_msg));
        }
    }

    if !summary.warnings.is_empty() {
        log_warning("ESLint", "warnings found (see summary below)");
    }

    if config.verbose {
        log_success("ESLint", "check passed");
    }

    Ok(())
}

// * Bundle JavaScript with esbuild CLI, with optional watch mode
pub fn build_scripts(config: &Config, config_dir: &Path, watch: bool) -> Result<(), String> {
    log_info("Building scripts", &format!("from: {}", config.js_input));

    let input = resolve_path(config_dir, &config.js_input);
    let output = config_dir.join(&config.js_output);

    if !input.exists() {
        return Err(ErrorContext::new("JavaScript input file not found")
            .with_details(&format!("{}", input.display()))
            .format());
    }

    let mut summary = ESLintSummary::default();

    handle_error(
        run_eslint(config, config_dir, &input, &mut summary),
        "ESLint check failed",
    )?;

    // * Set up esbuild CLI call for non-minified version
    let mut cmd = Command::new("esbuild");

    cmd.arg(input.as_os_str())
        .arg("--bundle")
        .arg(format!("--target={}", config.target))
        .arg(format!("--outfile={}", output.display()))
        .arg("--legal-comments=none");

    // Add format option
    cmd.arg(format!("--format={}", config.format));

    // Add source map option
    if config.sourcemap {
        cmd.arg("--sourcemap");
    }

    if watch {
        cmd.arg("--watch");
    }

    if config.verbose {
        log_info(
            "Running",
            &format!("esbuild with format: {}", config.format),
        );
    }

    let status = cmd.status().map_err(|e| {
        let error_msg = format!("Failed to run esbuild: {e}");
        log_error("Error", &error_msg);
        error_msg
    })?;

    if !status.success() {
        let error_msg = "esbuild failed".to_string();
        log_error("Error", &error_msg);
        return Err(error_msg);
    }

    let min_output = if config.minify {
        let min_path = output.with_file_name(format!(
            "{}.min{}",
            output.file_stem().unwrap().to_string_lossy(),
            output
                .extension()
                .map(|ext| format!(".{}", ext.to_string_lossy()))
                .unwrap_or_default()
        ));

        let mut cmd = Command::new("esbuild");

        cmd.arg(input.as_os_str())
            .arg("--bundle")
            .arg("--minify")
            .arg("--minify-syntax")
            .arg("--minify-whitespace")
            .arg(format!("--target={}", config.target))
            .arg(format!("--outfile={}", min_path.display()))
            .arg("--legal-comments=none")
            .arg(format!("--format={}", config.format));

        if config.sourcemap {
            cmd.arg("--sourcemap");
        }

        let status = cmd.status().map_err(|e| {
            let error_msg = format!("Failed to run esbuild minification: {e}");
            log_error("Error", &error_msg);
            error_msg
        })?;

        if !status.success() {
            let error_msg = "esbuild minification failed".to_string();
            log_error("Error", &error_msg);
            return Err(error_msg);
        }

        Some(min_path)
    } else {
        None
    };

    if config.verbose {
        log_success("JavaScript", &format!("written to: {}", output.display()));
        if let Some(ref min_path) = min_output {
            log_success(
                "JavaScript",
                &format!("minified version written to: {}", min_path.display()),
            );
        }
    }

    // * Copy result to alternate destination if defined
    if let Some(dest) = &config.js_destination {
        let dest_dir = config_dir.join(dest);
        let dest_path = dest_dir.join(Path::new(&config.js_output).file_name().unwrap());
        let dest_min_path = if config.minify {
            Some(
                dest_dir.join(Path::new(&config.js_output).with_file_name(format!(
                        "{}.min{}",
                        Path::new(&config.js_output)
                            .file_stem()
                            .unwrap()
                            .to_string_lossy(),
                        Path::new(&config.js_output)
                            .extension()
                            .map(|ext| format!(".{}", ext.to_string_lossy()))
                            .unwrap_or_default()
                    ))),
            )
        } else {
            None
        };

        // Create destination directory
        handle_error(
            fs::create_dir_all(&dest_dir),
            "Failed to create JS destination folder",
        )?;

        // Copy non-minified version
        fs::copy(&output, &dest_path).map_err(|e| {
            let error_msg = format!("Failed to copy JS to destination: {e}");
            log_error("Error", &error_msg);
            error_msg
        })?;

        // Copy minified version if it exists
        if let Some(ref min_path) = dest_min_path {
            if let Some(ref source_min) = min_output {
                if let Ok(min_content) = fs::read(source_min) {
                    // Create parent directory for minified file if needed
                    if let Some(parent) = min_path.parent() {
                        handle_error(
                            fs::create_dir_all(parent),
                            "Failed to create minified JS destination folder",
                        )?;
                    }
                    fs::write(min_path, min_content).map_err(|e| {
                        let error_msg = format!("Failed to copy minified JS to destination: {e}");
                        log_error("Error", &error_msg);
                        error_msg
                    })?;
                }
            }
        }

        if config.sourcemap {
            let map_path = output.with_extension("js.map");
            let dest_map_path = dest_path.with_extension("js.map");
            if let Ok(map_content) = fs::read(&map_path) {
                fs::write(&dest_map_path, map_content).map_err(|e| {
                    let error_msg = format!("Failed to copy JS sourcemap to destination: {e}");
                    log_error("Error", &error_msg);
                    error_msg
                })?;
            }
        }

        if config.verbose {
            log_success("JS", &format!("copied to: {}", dest_path.display()));
            if let Some(ref min_path) = dest_min_path {
                log_success(
                    "JS",
                    &format!("minified version copied to: {}", min_path.display()),
                );
            }
        }
    }

    // Display ESLint summary at the end
    summary.display();

    log_success("Scripts", "built successfully");
    Ok(())
}

// * Default values for missing config fields
fn default_minify() -> bool {
    if let Ok(val) = env::var("PACKR_MINIFY") {
        val == "true"
    } else {
        true
    }
}

fn default_target() -> String {
    env::var("PACKR_TARGET").unwrap_or_else(|_| "es2020".to_string())
}

fn default_verbose() -> bool {
    if let Ok(val) = env::var("PACKR_VERBOSE") {
        val == "true"
    } else {
        false
    }
}

fn default_sourcemap() -> bool {
    if let Ok(val) = env::var("PACKR_SOURCEMAP") {
        val == "true"
    } else {
        false
    }
}

fn default_format() -> String {
    env::var("PACKR_FORMAT").unwrap_or_else(|_| "iife".to_string())
}

fn default_eslint() -> bool {
    if let Ok(val) = env::var("PACKR_ESLINT") {
        val == "true"
    } else {
        false
    }
}
