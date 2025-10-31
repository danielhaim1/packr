const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Packr - Fast asset pipeline built in Rust for processing JavaScript and SCSS
 * @param {Object} options - Configuration options
 * @param {string} [options.config] - Path to configuration file
 * @param {string} [options.scssInput] - Path to SCSS input file
 * @param {string} [options.scssOutput] - Path to output compiled CSS
 * @param {string} [options.jsInput] - Path to JavaScript input file
 * @param {string} [options.jsOutput] - Path to output bundled JS
 * @param {string} [options.cssDestination] - Output directory for CSS
 * @param {string} [options.jsDestination] - Output directory for JS
 * @param {boolean} [options.minify=true] - Minify output
 * @param {string} [options.target='es2020'] - JavaScript target
 * @param {boolean} [options.watch=false] - Enable watch mode
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @param {boolean} [options.sourcemap=true] - Generate source maps
 * @param {string} [options.format='iife'] - JavaScript output format (iife, cjs, esm)
 * @returns {Promise<void>}
 */

function isPathInside(childPath, parentPath) {
	const relative = path.relative(parentPath, childPath);
	return !relative.startsWith('..') && !path.isAbsolute(relative);
}

const PROJECT_ROOT = process.cwd();

// * Secure error handling utilities
const ErrorHandler = {
	// * Mask sensitive information in error messages
	maskSensitiveInfo(message) {
		if (process.env.NODE_ENV === 'production') {
			return message.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]')
						 .replace(/key=([^&\s]+)/gi, 'key=[REDACTED]')
						 .replace(/token=([^&\s]+)/gi, 'token=[REDACTED]')
						 .replace(/secret=([^&\s]+)/gi, 'secret=[REDACTED]');
		}
		return message;
	},

	// * Format error for logging
	formatError(error, context = '') {
		const maskedMessage = this.maskSensitiveInfo(error.message);
		const stack = process.env.NODE_ENV === 'production' ? '' : `\n${error.stack}`;
		return `${context ? `${context}: ` : ''}${maskedMessage}${stack}`;
	},

	// * Handle error based on environment
	handleError(error, context = '') {
		const formattedError = this.formatError(error, context);
		if (process.env.NODE_ENV === 'production') {
			console.error(formattedError);
		} else {
			console.error(formattedError);
			if (error.stack) {
				console.debug('Stack trace:', error.stack);
			}
		}
		throw error;
	}
};

function loadEnvFromFile(filepath = '.env', override = false) {
	if (!fs.existsSync(filepath)) return;

	try {
		// Check file permissions (should be readable only by owner)
		const stats = fs.statSync(filepath);
		const mode = stats.mode & 0o777;
		if (mode !== 0o600 && process.env.NODE_ENV === 'production') {
			ErrorHandler.handleError(
				new Error(`Insecure permissions (${mode.toString(8)}) on environment file: ${filepath}`),
				'Security Warning'
			);
		}
	} catch (err) {
		ErrorHandler.handleError(err, 'File Permission Check Failed');
	}

	const lines = fs.readFileSync(filepath, 'utf8').split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const [key, ...rest] = trimmed.split('=');
		const value = rest.join('=').trim().replace(/^["']|["']$/g, ''); // strip quotes

		// Check for sensitive data patterns
		const sensitivePatterns = [
			/^(api[_-]?key|apikey)/i,
			/^(secret[_-]?key|secretkey)/i,
			/^(access[_-]?token|accesstoken)/i,
			/^(private[_-]?key|privatekey)/i,
			/password/i,
			/secret/i
		];

		const isSensitive = sensitivePatterns.some(pattern => pattern.test(key.trim()));
		if (isSensitive && value.length > 0) {
			// Log warning if sensitive data is not properly formatted
			if (value.length < 16 || /^(test|example|dummy)/i.test(value)) {
				console.warn(`Warning: Potentially weak or test ${key.trim()} detected in ${filepath}`);
			}
			
			// In production, ensure sensitive values are not logged
			if (process.env.NODE_ENV === 'production') {
				const maskedValue = '*'.repeat(8);
				console.log(`Loaded sensitive environment variable: ${key.trim()}=${maskedValue}`);
			}
		}

		if (override || !(key in process.env)) {
			process.env[key.trim()] = value;
		}
	}
}

// Load environment variables from multiple files based on NODE_ENV
function loadEnvFiles() {
	// Always load .env first (base configuration)
	loadEnvFromFile('.env');
	
	// Then load environment-specific file if NODE_ENV is set
	const nodeEnv = process.env.NODE_ENV || 'development';
	const envFile = `.env-${nodeEnv}`;
	
	// Load environment-specific file if it exists
	loadEnvFromFile(envFile, true); // Override with environment-specific values
	
	// For local development, also try .env-local
	if (nodeEnv === 'development' && fs.existsSync('.env-local')) {
		// Save current sourcemap setting
		const currentSourcemap = process.env.PACKR_SOURCEMAP;
		
		// Load .env-local without overriding sourcemap
		loadEnvFromFile('.env-local', true);
		
		// Restore sourcemap setting if it was set
		if (currentSourcemap !== undefined) {
			process.env.PACKR_SOURCEMAP = currentSourcemap;
		}
	}

	// In production, perform additional security checks
	if (nodeEnv === 'production') {
		// Check for required environment variables
		const requiredVars = [
			'PACKR_SCSS_INPUT',
			'PACKR_SCSS_OUTPUT',
			'PACKR_JS_INPUT',
			'PACKR_JS_OUTPUT'
		];

		const missing = requiredVars.filter(key => !process.env[key]);
		if (missing.length > 0) {
			throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
		}

		// Check if any sensitive variables are using default/example values
		const sensitiveVars = Object.keys(process.env)
			.filter(key => key.startsWith('PACKR_') && 
				(/key|token|secret|password/i.test(key)) &&
				(/example|test|dummy/i.test(process.env[key])));

		if (sensitiveVars.length > 0) {
			throw new Error(`Production environment contains example/test values for sensitive variables: ${sensitiveVars.join(', ')}`);
		}
	}
}

loadEnvFiles();

function packr(options = {}) {
	try {
		console.log('User provided options:', options);

		// * Resolve and validate all user paths
		function resolveSafe(p, baseDir = PROJECT_ROOT) {
			const resolved = path.resolve(baseDir, p);
			if (!isPathInside(resolved, PROJECT_ROOT)) {
				throw new Error(`Unsafe path detected: ${p}`);
			}
			return resolved;
		}

		// * Load config from file if specified
		let configFromFile = {};
		let configDir = PROJECT_ROOT;
		
		if (options.config) {
			try {
				configFromFile = JSON.parse(fs.readFileSync(options.config, 'utf8'));
				configDir = path.dirname(path.resolve(options.config));
				console.log('Loaded config from file:', configFromFile);
			} catch (err) {
				ErrorHandler.handleError(err, 'Config File Load Failed');
			}
		}

		// * Construct user config from options or file
		const userConfig = {
			scss_input: process.env.PACKR_SCSS_INPUT || options.scssInput || configFromFile.scss_input,
			scss_output: process.env.PACKR_SCSS_OUTPUT || options.scssOutput || configFromFile.scss_output,
			js_input: process.env.PACKR_JS_INPUT || options.jsInput || configFromFile.js_input,
			js_output: process.env.PACKR_JS_OUTPUT || options.jsOutput || configFromFile.js_output,
			css_destination: process.env.PACKR_CSS_DESTINATION || options.cssDestination || configFromFile.css_destination,
			js_destination: process.env.PACKR_JS_DESTINATION || options.jsDestination || configFromFile.js_destination,
			minify: process.env.PACKR_MINIFY === 'true' || (
				process.env.PACKR_MINIFY !== 'false' && (
					options.minify !== undefined ? options.minify :
					configFromFile.minify !== undefined ? configFromFile.minify : true
				)
			),
			minify_js: process.env.PACKR_MINIFY_JS === 'true' || (
				process.env.PACKR_MINIFY_JS !== 'false' && (
					options.minifyJs !== undefined ? options.minifyJs :
					configFromFile.minify_js !== undefined ? configFromFile.minify_js : true
				)
			),
			minify_css: process.env.PACKR_MINIFY_CSS === 'true' || (
				process.env.PACKR_MINIFY_CSS !== 'false' && (
					options.minifyCss !== undefined ? options.minifyCss :
					configFromFile.minify_css !== undefined ? configFromFile.minify_css : true
				)
			),
			uglify: {
				mangle: process.env.PACKR_UGLIFY_MANGLE === 'true' || (
					process.env.PACKR_UGLIFY_MANGLE !== 'false' && (
						options.uglify?.mangle !== undefined ? options.uglify.mangle :
						configFromFile.uglify?.mangle !== undefined ? configFromFile.uglify.mangle : true
					)
				),
				keep_fnames: process.env.PACKR_UGLIFY_KEEP_FNAMES === 'true' || (
					options.uglify?.keepFnames !== undefined ? options.uglify.keepFnames :
					configFromFile.uglify?.keep_fnames !== undefined ? configFromFile.uglify.keep_fnames : false
				),
				keep_classnames: process.env.PACKR_UGLIFY_KEEP_CLASSNAMES === 'true' || (
					options.uglify?.keepClassnames !== undefined ? options.uglify.keepClassnames :
					configFromFile.uglify?.keep_classnames !== undefined ? configFromFile.uglify.keep_classnames : false
				),
				reserved: (process.env.PACKR_UGLIFY_RESERVED || 
					options.uglify?.reserved || 
					configFromFile.uglify?.reserved || '')
					.split(',')
					.filter(Boolean)
			},
			target: process.env.PACKR_TARGET || options.target || configFromFile.target || 'es2020',
			verbose: process.env.PACKR_VERBOSE === 'true' || options.verbose || configFromFile.verbose || false,
			sourcemap: process.env.PACKR_SOURCEMAP === 'true' ? true : (
				process.env.PACKR_SOURCEMAP === 'false' ? false : (
					options.sourcemap !== undefined ? options.sourcemap :
					configFromFile.sourcemap !== undefined ? configFromFile.sourcemap : false
				)
			),
			format: process.env.PACKR_FORMAT || options.format || configFromFile.format || 'iife',
			eslint: process.env.PACKR_ESLINT === 'true' || configFromFile.eslint || false,
			eslint_config: process.env.PACKR_ESLINT_CONFIG || configFromFile.eslint_config
		};

		console.log('User config:', userConfig);

		// * Validate required fields
		const required = ['scss_input', 'scss_output', 'js_input', 'js_output'];
		for (const key of required) {
			if (!userConfig[key]) {
				throw new Error(`Missing required option: "${key}"`);
			}
		}

		// * Convert all paths to absolute
		const config = {
			...userConfig,
			scss_input: resolveSafe(userConfig.scss_input, configDir),
			scss_output: resolveSafe(userConfig.scss_output, configDir),
			js_input: resolveSafe(userConfig.js_input, configDir),
			js_output: resolveSafe(userConfig.js_output, configDir),
			css_destination: userConfig.css_destination ? resolveSafe(userConfig.css_destination, configDir) : undefined,
			js_destination: userConfig.js_destination ? resolveSafe(userConfig.js_destination, configDir) : undefined
		};

		console.log('Final config with absolute paths:', config);

		// * Normalize outputs
		const joinOut = (outFile, destDir, baseDir) => {
			const outAbs = path.resolve(baseDir, outFile);
			const outBase = path.basename(outAbs);
			const outDir = destDir ? path.resolve(baseDir, destDir) : path.dirname(outAbs);
			return path.join(outDir, outBase);
		};

		const normalized_scss_output = joinOut(config.scss_output, config.css_destination, configDir);
		const normalized_js_output   = joinOut(config.js_output, config.js_destination, configDir);

		// * Create config file for Rust binary
		const configPath = path.resolve('.packr-config.json');
		fs.writeFileSync(configPath, JSON.stringify({
			scss_input: config.scss_input,
			scss_output: normalized_scss_output,
			js_input: config.js_input,
			js_output: normalized_js_output,
			minify: config.minify,
			minify_js: config.minify_js,
			minify_css: config.minify_css,
			uglify: config.uglify,
			target: config.target,
			verbose: config.verbose,
			sourcemap: config.sourcemap,
			format: config.format
		}, null, 2));


		// * Get the path to the binary
		const binaryPath = path.join(__dirname, 'bin', process.platform === 'win32' ? 'packr.exe' : 'packr');

		// * Check if the binary exists
		if (!fs.existsSync(binaryPath)) {
			return Promise.reject(new Error(`Binary not found at ${binaryPath}. Please run 'npm run build' first.`));
		}

		// * Prepare arguments
		const args = [configPath];
		if (options.watch) {
			args.push('--watch');
		}

		// * Return a promise that resolves when the process exits
		return new Promise((resolve, reject) => {
			const packrProcess = spawn(binaryPath, args, {
				stdio: 'inherit',
				shell: process.platform === 'win32',
				env: {
					...process.env,
					NODE_ENV: process.env.NODE_ENV || 'production'
				}
			});

			packrProcess.on('close', (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Packr process exited with code ${code}`));
				}
			});

			packrProcess.on('error', (err) => {
				reject(err);
			});
		});
	} catch (err) {
		ErrorHandler.handleError(err, 'Packr Error');
	}
}

/**
 * Watch for changes and rebuild automatically
 * @param {Object} options - Configuration options (same as packr)
 * @returns {Promise<void>}
 */
function watch(options = {}) {
	return packr({ ...options, watch: true });
}

// * CLI entry
if (require.main === module) {
	const args = process.argv.slice(2);
	let configPath = args[0] 
	  || (fs.existsSync(path.join(process.cwd(), 'packr.json'))
	        ? path.join(process.cwd(), 'packr.json')
	        : path.join(process.cwd(), '.packr.json'));

	const watchMode = args.includes('--watch');

	if (fs.existsSync(configPath) && fs.statSync(configPath).isDirectory()) {
		configPath = path.join(configPath, '.packr.json');
	}

	if (!fs.existsSync(configPath)) {
		console.error(`Config file not found: ${configPath}`);
		process.exit(1);
	}

	try {
	    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

	    return packr({ ...config, watch: watchMode }).catch((err) => {
	        console.error(err);
	        process.exit(1);
	    });
	} catch (err) {
	    console.error(`Error reading config: ${err.message}`);
	    process.exit(1);
	}
}

module.exports = {
	packr,
	watch
};
