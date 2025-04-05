/**
 * Packr - Fast asset pipeline built in Rust for processing JavaScript and SCSS
 */

declare module '@danielhaim/packr' {
	/**
	 * Configuration options for Packr
	 */
	export interface PackrOptions {
		/** Path to SCSS input file */
		scss_input?: string;

		/** Path to SCSS output file */
		scss_output?: string;

		/** Path to JavaScript input file */
		js_input?: string;

		/** Path to JavaScript output file */
		js_output?: string;

		/** Optional path for an alternate CSS output */
		css_destination?: string;

		/** Optional path for an alternate JavaScript output */
		js_destination?: string;

		/** Whether to minify output (default: true) */
		minify?: boolean;

		/** JavaScript-specific minification (default: true) */
		minify_js?: boolean;

		/** CSS-specific minification (default: true) */
		minify_css?: boolean;

		/** JavaScript target version (default: "es2020") */
		target?: string;

		/** Enable watch mode (default: false) */
		watch?: boolean;

		/** Enable verbose logging (default: false) */
		verbose?: boolean;

		/** Generate source maps (default: false) */
		sourcemap?: boolean;

		/** Output format: iife, cjs, or esm (default: "iife") */
		format?: 'iife' | 'cjs' | 'esm';

		/** Enable ESLint checking (default: false) */
		eslint?: boolean;

		/** Path to custom ESLint config file */
		eslint_config?: string;

		/** Uglification options */
		uglify?: {
			/** Enable name mangling (default: true) */
			mangle?: boolean;
			/** Preserve function names (default: false) */
			keep_fnames?: boolean;
			/** Preserve class names (default: false) */
			keep_classnames?: boolean;
			/** Comma-separated list of names to preserve */
			reserved?: string[];
		};
	}

	/**
	 * Process assets according to the provided configuration
	 * @param options Configuration options
	 * @returns Promise that resolves when processing is complete
	 */
	function packr(options?: PackrOptions): Promise<void>;

	/**
	 * Watch for changes and process assets automatically
	 * @param options Configuration options
	 * @returns Promise that resolves when watch mode is started
	 */
	function watch(options?: PackrOptions): Promise<void>;

	export { packr, watch };
}
