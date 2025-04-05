const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname); // Safe boundary for deletion

// * Load environment variables from .env file
function loadEnvFromFile(filepath = '.env', override = false) {
	if (!fs.existsSync(filepath)) return;

	const lines = fs.readFileSync(filepath, 'utf8').split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const [key, ...rest] = trimmed.split('=');
		const value = rest.join('=').trim().replace(/^["']|["']$/g, ''); // strip quotes
		if (override || !(key in process.env)) {
			process.env[key.trim()] = value;
		}
	}
}

function isPathInside(childPath, parentPath) {
	const relative = path.relative(parentPath, childPath);
	return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function safeDelete(targetPath) {
	const resolved = path.resolve(targetPath);
	if (!fs.existsSync(resolved)) return;

	if (!isPathInside(resolved, ROOT_DIR)) {
		throw new Error(`Unsafe delete blocked for: ${resolved}`);
	}

	fs.rmSync(resolved, { recursive: true, force: true });
}

// * Test cases configuration
const tests = [
	{
		name: 'Default Packr Configuration',
		dir: 'test-packr-default',
		config: 'packr.json',
		description: 'Tests default Packr configuration with IIFE format and sourcemaps'
	},
	{
		name: 'Custom Config File',
		dir: 'test-packr-custom-config',
		config: 'custom-packr.json',
		description: 'Tests custom configuration file with different paths and settings'
	},
	{
		name: 'ESM Format',
		dir: 'test-packr-format',
		config: 'packr.json',
		description: 'Tests Packr with ESM format output'
	},
	{
		name: 'No Sourcemaps',
		dir: 'test-packr-no-sourcemaps',
		config: 'packr.json',
		description: 'Tests Packr with sourcemaps disabled'
	},
	{
		name: 'Minification',
		dir: 'test-packr-minify',
		config: 'packr.json',
		description: 'Tests Packr with minification enabled and complex SCSS/JS input'
	},
	{
		name: 'ESLint',
		dir: 'test-packr-eslint',
		config: 'packr.json',
		description: 'Tests Packr with ESLint enabled'
	},
	{
		name: 'Packr .env',
		dir: 'test-packr-env',
		config: 'packr.json',
		description: 'Tests Packr with environment variables from .env file'
	},
];

// * Setup test environment
function setupTestEnvironment(test) {
	const testDir = path.resolve(__dirname, test.dir);
	
	// Clean up any existing output directories
	const distDir = path.resolve(testDir, 'dist');
	if (fs.existsSync(distDir)) {
		safeDelete(distDir);
	}
	
	// Load the config file to check for destination directories
	const configPath = path.resolve(testDir, test.config);
	if (fs.existsSync(configPath)) {
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		
		// Clean up CSS destination directory if specified
		if (config.css_destination) {
			const cssDestDir = path.resolve(testDir, config.css_destination);
			if (fs.existsSync(cssDestDir)) {
				safeDelete(cssDestDir);
			}
		}
		
		// Clean up JS destination directory if specified
		if (config.js_destination) {
			const jsDestDir = path.resolve(testDir, config.js_destination);
			if (fs.existsSync(jsDestDir)) {
				safeDelete(jsDestDir);
			}
		}
	}
}

// * Run a single test
function runTest(test) {
	console.log(`\nRunning test: ${test.name}`);
	console.log(`Description: ${test.description}`);
	
	const testDir = path.resolve(__dirname, test.dir);
	const configPath = path.resolve(testDir, test.config);
	const packrBin = path.resolve(__dirname, '../bin/packr');
	
	try {
		// Setup test environment
		setupTestEnvironment(test);
		
		// Load environment variables for environment test
		if (test.name === 'Packr .env') {
			// Save original NODE_ENV
			const originalNodeEnv = process.env.NODE_ENV;
			
			try {
				// Force development mode for environment test
				process.env.NODE_ENV = 'development';
				
				// Load base .env first
				const baseEnvPath = path.resolve(testDir, '.env');
				if (fs.existsSync(baseEnvPath)) {
					console.log(`Loading base environment variables from: ${baseEnvPath}`);
					loadEnvFromFile(baseEnvPath);
				}

				// Load environment-specific file if NODE_ENV is set
				const nodeEnv = process.env.NODE_ENV || 'development';
				const envFile = `.env-${nodeEnv}`;
				const envPath = path.resolve(testDir, envFile);
				
				if (fs.existsSync(envPath)) {
					console.log(`Loading ${nodeEnv} environment variables from: ${envPath}`);
					loadEnvFromFile(envPath, true); // Override with environment-specific values
				}

				// For local development, also try .env-local
				if (nodeEnv === 'development') {
					const localEnvPath = path.resolve(testDir, '.env-local');
					if (fs.existsSync(localEnvPath)) {
						console.log(`Loading local environment variables from: ${localEnvPath}`);
						loadEnvFromFile(localEnvPath, true); // Override with local values
					}
				}
			} finally {
				// Restore original NODE_ENV
				process.env.NODE_ENV = originalNodeEnv;
			}
		}
		
		// Load the config file
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		
		// Update paths to use shared assets with relative paths
		config.scss_input = '../assets/scss/app.scss';
		config.js_input = '../assets/js/app.js';
		
		// Write the updated config
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
		
		// Run Packr
		console.log(`\nExecuting Packr with config: ${configPath}`);
		execSync(`${packrBin} build --config ${configPath}`, { 
			stdio: 'inherit',
			env: {
				...process.env,
				NODE_ENV: test.name === 'Packr .env' ? 'development' : process.env.NODE_ENV,
				PACKR_SOURCEMAP: config.sourcemap.toString() // Explicitly set sourcemap from config
			}
		});
		
		// Verify output files
		const distDir = path.resolve(testDir, 'dist');
		
		// Check dist files
		const distCss = path.resolve(distDir, path.basename(config.scss_output));
		const distJs = path.resolve(distDir, path.basename(config.js_output));
		
		if (!fs.existsSync(distCss)) {
			throw new Error(`CSS file not found: ${distCss}`);
		}
		if (!fs.existsSync(distJs)) {
			throw new Error(`JS file not found: ${distJs}`);
		}
		
		// Check destination files if specified
		if (config.css_destination) {
			const destCss = path.resolve(testDir, config.css_destination, path.basename(config.scss_output));
			if (!fs.existsSync(destCss)) {
				throw new Error(`CSS destination file not found: ${destCss}`);
			}
		}
		
		if (config.js_destination) {
			const destJs = path.resolve(testDir, config.js_destination, path.basename(config.js_output));
			if (!fs.existsSync(destJs)) {
				throw new Error(`JS destination file not found: ${destJs}`);
			}
		}
		
		// Verify sourcemaps based on config
		const cssMap = distCss + '.map';
		const jsMap = distJs + '.map';
		
		if (config.sourcemap) {
			if (!fs.existsSync(cssMap)) {
				throw new Error(`CSS sourcemap not found: ${cssMap}`);
			}
			if (!fs.existsSync(jsMap)) {
				throw new Error(`JS sourcemap not found: ${jsMap}`);
			}
		} else {
			if (fs.existsSync(cssMap)) {
				throw new Error(`CSS sourcemap should not exist: ${cssMap}`);
			}
			if (fs.existsSync(jsMap)) {
				throw new Error(`JS sourcemap should not exist: ${jsMap}`);
			}
		}
		
		console.log(`✅ Test passed: ${test.name}`);
		return true;
	} catch (error) {
		console.error(`❌ Test failed: ${test.name}`);
		console.error(`Error: ${error.message}`);
		return false;
	}
}

// * Run all tests
function runTests() {
	console.log('Starting Packr tests...\n');
	
	let passed = 0;
	let failed = 0;
	
	tests.forEach(test => {
		if (runTest(test)) {
			passed++;
		} else {
			failed++;
		}
	});
	
	console.log('\nTest Summary:');
	console.log(`Total tests: ${tests.length}`);
	console.log(`Passed: ${passed}`);
	console.log(`Failed: ${failed}`);
	
	process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
