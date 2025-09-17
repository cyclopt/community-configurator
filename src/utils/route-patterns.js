// Regex patterns for tracking page routes. Include paths that differ only in search parameters as well.
// Additional patterns to capture dynamic routes and query parameters where applicable.
const ROUTE_PATTERNS = [
	{ pattern: /^\/home$/, group: "configurator", pageKey: "Home" },
	{ pattern: /^\/order$/, group: "configurator", pageKey: "Subscription" },
	{ pattern: /^\/companion$/, group: "configurator", pageKey: "Companion" },
];

export default ROUTE_PATTERNS;
