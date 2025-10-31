# Packr
[![npm downloads](https://img.shields.io/npm/dm/@danielhaim/packr.svg)](https://www.npmjs.com/package/@danielhaim/packr)
[![GitHub issues](https://img.shields.io/github/issues/danielhaim1/packr.svg)](https://github.com/danielhaim1/packr/issues)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Rust version](https://img.shields.io/badge/rust-%3E%3D1.70-orange.svg)](https://www.rust-lang.org)
[![License](https://img.shields.io/github/license/danielhaim1/packr.svg)](https://github.com/danielhaim1/packr/blob/main/LICENSE)

A fast asset pipeline built in Rust for processing JavaScript and SCSS.

---

## Requirements

- Node.js >= 18  
- Rust >= 1.70  
- npm >= 9

---

## Installation

```bash
# Install from npm
npm install @danielhaim/packr

# Or install globally
npm install -g @danielhaim/packr
```

---

## Usage

Packr can be used via the JavaScript API, a `packr.json` config file, or the CLI.

### JavaScript API

```js
const packr = require('@danielhaim/packr');

packr({
  scss_input: 'src/scss/app.scss',
  scss_output: 'dist/app.css',
  js_input: 'src/js/app.js',
  js_output: 'dist/app.js',
  minify: true,
  watch: false
});
```

### Configuration File

Create a `packr.json` in your project root:

```json
{
  "scss_input": "src/scss/app.scss",
  "scss_output": "dist/app.css",
  "js_input": "src/js/app.js",
  "js_output": "dist/app.js",
  "css_destination": "public/css",
  "js_destination": "public/js",
  "minify": true,
  "target": "es2020",
  "verbose": true,
  "sourcemap": true,
  "format": "iife",
  "watch": true
}
```

Then run:

```js
const packr = require('@danielhaim/packr');
packr(); // Loads from .packr.json
```

### CLI

```bash
# Default config (packr.json or .packr.json)
packr

# Use a specific config file
packr --config custom/packr.json

# Enable watch mode
packr --watch
```

---

## Configuration Options

| Option            | Type      | Default     | Description                                    |
|------------------|-----------|-------------|------------------------------------------------|
| `scss_input`     | `string`  | _required_  | Path to SCSS input file                        |
| `scss_output`    | `string`  | _required_  | Path to SCSS output file                       |
| `js_input`       | `string`  | _required_  | Path to JavaScript input file                  |
| `js_output`      | `string`  | _required_  | Path to JavaScript output file                 |
| `css_destination`| `string`  | —           | Optional alternate output path for CSS         |
| `js_destination` | `string`  | —           | Optional alternate output path for JS          |
| `minify`         | `boolean` | `true`      | Minify the output                              |
| `target`         | `string`  | `'es2020'`  | JavaScript target version                      |
| `watch`          | `boolean` | `false`     | Watch files for changes                        |
| `verbose`        | `boolean` | `false`     | Enable extra console output                    |
| `sourcemap`      | `boolean` | `false`     | Include source maps in the output              |
| `format`         | `string`  | `'iife'`    | Output format: `iife`, `cjs`, or `esm`         |
| `eslint`         | `boolean` | `false`     | Enable ESLint checking                         |
| `eslint_config`  | `string`  | —           | Path to custom ESLint config file              |

## Environment Configuration

Packr supports configuration through environment variables, which can be set in environment files in your project root. This allows for flexible configuration across different environments.

### Environment Files

Packr loads environment variables from the following files in order of precedence (highest to lowest):

1. `.env` (base configuration)
2. `.env-{NODE_ENV}` (e.g., `.env-production`, `.env-staging`)
3. `.env-local` (only in development mode)

### Security Best Practices

When working with environment files and sensitive data:

1. **File Security**
   - Never commit `.env` files to version control
   - Use `.env.example` as a template (included in repo)
   - Set restrictive permissions: `chmod 600 .env*`
   - Keep environment files outside of public directories

2. **Sensitive Data**
   - Use strong, unique values for API keys and secrets
   - Avoid using test/example values in production
   - Never log sensitive values in production
   - Rotate secrets regularly

3. **Production Checks**
   - Required variables are validated
   - File permissions are verified
   - Sensitive variables are masked in logs
   - Example/test values are rejected

4. **Development Safety**
   - Use `.env-local` for development-only values
   - Keep production secrets separate from development
   - Document required variables in `.env.example`

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PACKR_SCSS_INPUT` | Path to SCSS input file | - |
| `PACKR_SCSS_OUTPUT` | Path to output compiled CSS | - |
| `PACKR_JS_INPUT` | Path to JavaScript input file | - |
| `PACKR_JS_OUTPUT` | Path to output bundled JS | - |
| `PACKR_CSS_DESTINATION` | Output directory for CSS | - |
| `PACKR_JS_DESTINATION` | Output directory for JS | - |
| `PACKR_MINIFY` | Minify output | `true` |
| `PACKR_TARGET` | JavaScript target | `es2020` |
| `PACKR_VERBOSE` | Enable verbose logging | `false` |
| `PACKR_SOURCEMAP` | Generate source maps | `false` |
| `PACKR_FORMAT` | JavaScript output format (iife, cjs, esm) | `iife` |
| `PACKR_ESLINT` | Enable ESLint | `false` |
| `PACKR_ESLINT_CONFIG` | Path to ESLint config | - |
| `PACKR_MINIFY_JS` | JavaScript-specific minification | `true` |
| `PACKR_MINIFY_CSS` | CSS-specific minification | `true` |
| `PACKR_UGLIFY_MANGLE` | Enable name mangling | `true` |
| `PACKR_UGLIFY_KEEP_FNAMES` | Preserve function names | `false` |
| `PACKR_UGLIFY_KEEP_CLASSNAMES` | Preserve class names | `false` |
| `PACKR_UGLIFY_RESERVED` | Comma-separated list of names to preserve | - |

### Example .env File

```
PACKR_SCSS_INPUT=src/scss/app.scss
PACKR_SCSS_OUTPUT=dist/app.css
PACKR_JS_INPUT=src/js/app.js
PACKR_JS_OUTPUT=dist/app.js
PACKR_CSS_DESTINATION=public/css
PACKR_JS_DESTINATION=public/js
PACKR_MINIFY=true
PACKR_TARGET=es2020
PACKR_VERBOSE=false
PACKR_SOURCEMAP=false
PACKR_FORMAT=iife
PACKR_ESLINT=false
```

Environment variables take precedence over configuration file options, allowing you to override settings for specific environments without changing your configuration files.

### Minification Options

Packr provides granular control over minification and uglification:

#### Basic Minification
- `PACKR_MINIFY`: Global switch for all minification (default: `true`)
- `PACKR_MINIFY_JS`: JavaScript-specific minification (default: `true`)
- `PACKR_MINIFY_CSS`: CSS-specific minification (default: `true`)

#### JavaScript Uglification
- `PACKR_UGLIFY_MANGLE`: Enable name mangling (default: `true`)
- `PACKR_UGLIFY_KEEP_FNAMES`: Preserve function names (default: `false`)
- `PACKR_UGLIFY_KEEP_CLASSNAMES`: Preserve class names (default: `false`)
- `PACKR_UGLIFY_RESERVED`: Comma-separated list of names to preserve (e.g., `jQuery,$`)

Example configuration in `.packr.json`:
```json
{
  "minify": true,
  "minify_js": true,
  "minify_css": true,
  "uglify": {
    "mangle": true,
    "keep_fnames": false,
    "keep_classnames": false,
    "reserved": ["jQuery", "$"]
  }
}
```

The minification process:
1. **JavaScript**:
   - Removes whitespace and comments
   - Shortens variable names (mangling)
   - Optimizes code structure
   - Preserves specified names

2. **CSS**:
   - Removes whitespace and comments
   - Combines identical selectors
   - Optimizes property values
   - Removes unused rules

---

## Testing

Packr includes a comprehensive test suite that covers various build scenarios:

### Test Cases

1. **Default Configuration**
   - Tests default Packr settings with IIFE format and sourcemaps
   - Verifies basic SCSS and JavaScript compilation

2. **Custom Config File**
   - Tests custom configuration with different paths and settings
   - Validates alternate destination paths for CSS and JS

3. **ESM Format**
   - Tests Packr with ESM (ECMAScript Modules) output format
   - Ensures proper module bundling

4. **No Sourcemaps**
   - Tests builds with sourcemaps disabled
   - Verifies clean output without map files

5. **Minification**
   - Tests minification of both SCSS and JavaScript
   - Validates `.min` file generation

6. **ESLint Integration**
   - Tests JavaScript linting with ESLint
   - Provides detailed warning summaries with line numbers
   - Supports custom ESLint configurations

### Running Tests

```bash
# Run all tests
node __tests__/test.js

# Run specific test
node __tests__/test.js --test "Default Packr Configuration"
node __tests__/test.js --test "Custom Config File"
node __tests__/test.js --test "ESM Format"
node __tests__/test.js --test "No Sourcemaps"
node __tests__/test.js --test "Minification"
node __tests__/test.js --test "ESLint"
```

### ESLint Integration

Packr includes built-in ESLint support for JavaScript files:

```json
{
  "eslint": true,
  "eslintConfig": ".eslintrc.json"
}
```

ESLint warnings are displayed in a detailed format:
```
File: src/js/app.js
Warnings:
  Line 8, Column 5: no-var - Unexpected var, use let or const instead.
  Line 15, Column 9: prefer-const - 'y' is never reassigned. Use 'const' instead.
  Line 16, Column 13: semi - Missing semicolon.
  Line 38, Column 5: no-var - Unexpected var, use let or const instead.
```

---

## Performance

Packr uses Rust for fast and efficient asset builds:

- **SCSS**: Compiled with the Rust-based [`grass`](https://github.com/connorskees/grass)
- **JavaScript**: Bundled using [`esbuild`](https://github.com/evanw/esbuild)
- **CSS Optimization**: Handled by [`lightningcss`](https://github.com/parcel-bundler/lightningcss)
- **Memory + Speed**: Lightweight, with fast cold and incremental builds

---

## Roadmap

### Core Features
- [ ] PostCSS integration
- [ ] SortCSS integration
- [ ] TypeScript support
- [ ] CSS Modules support
- [ ] Source map improvements
- [ ] Incremental builds
- [ ] Tree-shaking / dead code elimination
- [ ] Asset hashing / versioning
- [ ] Multi-entry compilation support

### Tooling & Plugins
- [ ] Improve environment-based config support (`.env`, NODE_ENV, etc.)

### Developer Experience
- [ ] Watch mode with hot reload hooks
- [ ] Verbose and colorized logging
- [ ] Build profiling (timing per task)
- [ ] Interactive CLI or TUI dashboard

### Output & Format Options
- [ ] Custom JS output formats (CommonJS, ESM, IIFE)
- [ ] Configurable output directory structure

---

## Contributing

See the [Contributing Guide](CONTRIBUTING.md) for details on submitting issues or PRs.

---

## Security

If you find a security issue, please report it privately via a GitHub discussion. Avoid using the issue tracker.

---

## License

Packr is licensed under the [Apache License 2.0](LICENSE).

---

## Credits

Packr is built with:

- [esbuild](https://github.com/evanw/esbuild) – JavaScript bundler
- [grass](https://github.com/connorskees/grass) – SCSS compiler in Rust
- [lightningcss](https://github.com/parcel-bundler/lightningcss) – CSS optimizer