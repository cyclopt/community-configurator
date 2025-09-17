import { execSync } from "node:child_process";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from 'node:path';

const commitHash = execSync("git rev-parse --short HEAD").toString();

export default defineConfig({
	plugins: [react()],
	define: {
		__COMMIT_HASH__: JSON.stringify(commitHash),
	},
	optimizeDeps: {
		include: ['react', 'react-dom'],
	},
	resolve: {
		alias: {
		// Ensure only one instance of React is used
			react: path.resolve(import.meta.dirname, 'node_modules/react'),
			'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
			},
		},
	},
});
