# Packr
![Build](https://img.shields.io/github/actions/workflow/status/danielhaim1/packr/rust.yml)

A fast, reliable asset pipeline built in Rust for processing JavaScript and SCSS files. This tool provides a simple and efficient way to compile, bundle, and optimize your frontend assets.

## Features

- SCSS compilation with optimization
- JavaScript bundling and minification
- Fast processing using Rust
- Simple command-line interface
- Clear error reporting

## Requirements

- Rust 2021 edition or later
- Node.js >= 18 (for esbuild)
- Cargo (Rust's package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/danielhaim1/packr.git
cd packr
```

2. Install dependencies:
```bash
# Install Rust dependencies
cargo build

# Install Node.js dependencies
npm install
```

## Usage

Build all assets:
```bash
npm run build
# or
cargo run -- build
```

Watch mode for development:
```bash
npm run watch
# or
cargo run -- watch
```

This will:
- Compile SCSS from `src/scss/app.scss` to `dist/app.css`
- Bundle and minify JavaScript from `src/js/app.js` to `dist/app.js`

## Project Structure

```
packr/
├── src/
│   ├── js/           # JavaScript source files
│   │   ├── app.js    # Main JavaScript entry point
│   │   ├── utils/    # Utility functions
│   │   └── components/ # Component modules
│   ├── scss/         # SCSS source files
│   │   └── app.scss  # Main SCSS entry point
│   ├── main.rs       # Main Rust entry point
│   └── build.rs      # Build logic
├── dist/             # Compiled output
├── Cargo.toml        # Rust dependencies
└── package.json      # Node.js dependencies
```

## Development

The project uses:
- `grass` for SCSS compilation
- `lightningcss` for CSS optimization
- `esbuild` for JavaScript bundling

## License

MIT License - see LICENSE file for details 