import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import unicornPlugin from "eslint-plugin-unicorn";
import stylisticPlugin from "@stylistic/eslint-plugin";
import cypressPlugin from "eslint-plugin-cypress";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

import globals from "globals";

// Create a mapping of plugin names to their imported objects
const pluginsMap = {
	react: reactPlugin,
	"react-hooks": reactHooksPlugin,
	import: importPlugin,
	unicorn: unicornPlugin,
	"@stylistic": stylisticPlugin,
	cypress: cypressPlugin,
	"jsx-a11y": jsxA11yPlugin,
};

// Define custom rules for the project
const customRules = {
	"unicorn/no-array-reduce": 0,
	"unicorn/no-null": "off",
	"react/react-in-jsx-scope": "off",
	"react/jsx-uses-react": "off",
	"unicorn/expiring-todo-comments": "off",
	"unicorn/no-nested-ternary": "off",
	"react/display-name": "off",
	"unicorn/filename-case": "off",
	"jsx-a11y/no-autofocus": "off",
	"unicorn/prevent-abbreviations": "off",
	"import/no-named-as-default-member": "off",
	"unicorn/no-array-callback-reference": "off",
	"react/prop-types": "off",
	'react-hooks/rules-of-hooks': 'error',
	"import/no-unresolved": [
		"error",
		{
			ignore: [
				"#utils",
				"#api",
				"#customHooks",
				"@cyclopt/utils",
				"@iamnapo/average",
				"@iamnapo/construct-url",
				"@iamnapo/sort",
				"mem",
			],
		},
	],
	"no-undef": "error",
	"no-extra-semi": "error",
	"no-constant-condition": "error",
	"no-mixed-spaces-and-tabs": "error",
	"indent": ["error", "tab"],
	"no-unused-vars": ["error", {
		"vars": "all",
		"args": "after-used",
		"ignoreRestSiblings": true,
		"varsIgnorePattern": "^_+$",
		"argsIgnorePattern": "^_+$"
	}],
	"no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0 }],
};

// Function to safely extract recommended rules
const getRecommendedRules = (plugin) => {
	return plugin.configs && plugin.configs.recommended && plugin.configs.recommended.rules
		? plugin.configs.recommended.rules
		: {};
};

// Combine rules from all plugins
const combinedRules = {
	...getRecommendedRules(reactPlugin),
	...getRecommendedRules(reactHooksPlugin),
	...getRecommendedRules(importPlugin),
	...getRecommendedRules(unicornPlugin),
	...getRecommendedRules(cypressPlugin),
	...getRecommendedRules(jsxA11yPlugin),
	...getRecommendedRules(stylisticPlugin), // If exists
	...customRules,
};

const sanitizeGlobals = (globalsObj) => {
	return Object.fromEntries(
		Object.entries(globalsObj).map(([key, value]) => [key.trim(), value])
	);
};

// Merge default ESLint globals with your custom globals
const defaultGlobals = sanitizeGlobals({
	...globals.builtin,       // Built-in ESLint globals
	...globals.browser,       // Browser globals
	...globals.node,          // Node.js globals
	...globals.es2021,        // ES2021 globals
	AudioWorkletGlobalScope: false,
	structuredClone: false,
	// Add more environments if needed, e.g., globals.worker, globals.jquery, etc.
});

delete defaultGlobals["AudioWorkletGlobalScope "];

// Define your custom globals
const customGlobals = {
	// clearTimeout: "writable",
	// Add any additional custom globals here
};

// Merge default and custom globals, giving precedence to custom globals
const mergedGlobals = {
	...defaultGlobals,
	...customGlobals,
};

// Define the main configuration
const mainConfig = {
	files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
	languageOptions: {
		parserOptions: {
			ecmaVersion: 2021, // Adjust based on your project's needs
			sourceType: 'module',
			ecmaFeatures: {
				jsx: true, // Enable JSX parsing
			},
		},
		globals: mergedGlobals,
	},
	plugins: pluginsMap,
	settings: {
		react: {
			version: 'detect', // Automatically detect React version
		},
		'import/resolver': {
			node: {
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
			},
		},
	},
	rules: combinedRules,
};

const ignoreConfig = {
	ignores: ["node_modules/", "dist/", "client-test*"],
};

// Export the Flat Config array
export default [ignoreConfig, mainConfig];