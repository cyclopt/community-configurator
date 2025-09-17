import * as Sentry from '@sentry/react';
import { Replay } from '@sentry/replay';

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
	ignoreErrors: [
		"ResizeObserver loop limit exceeded",
		"Non-Error promise rejection captured",
	],
	enabled: import.meta.env.PROD ?? true,
	replaysOnErrorSampleRate: 1,
	integrations: [
		new Replay({
			maskAllText: true,
		}),
	],
});

export default Sentry;
