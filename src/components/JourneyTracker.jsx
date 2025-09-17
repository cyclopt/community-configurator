import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import { registerJourney } from "#api";
import { ROUTE_PATTERNS } from "#utils";

const JourneyTracker = ({ decodedToken, children }) => {
	const { pathname } = useLocation();
	const lastPathnameRef = useRef();
	const isProcessingRef = useRef(false); // Prevent concurrent registrations (without it the home journey is registered twice on rerender)

	useEffect(() => {
		if (!decodedToken?.customToken && pathname !== lastPathnameRef.current && !isProcessingRef.current) {
			try {
				const matchingRoute = ROUTE_PATTERNS.find((r) => r.pattern.test(pathname));

				if (matchingRoute?.pageKey && pathname !== "/") {
					const { pageKey, group } = matchingRoute;
					isProcessingRef.current = true; // update processing flag
					(async () => {
						try {
							await registerJourney({ pageKey, group });
							lastPathnameRef.current = pathname; // Update the ref after successful registration
						} catch {
							// Handle error
						} finally {
							isProcessingRef.current = false; // Reset processing flag
						}
					})();
				}
			} catch { /* */ }
		}
	}, [decodedToken, pathname]);

	return children;
};

JourneyTracker.propTypes = {
	children: PropTypes.node.isRequired,
	decodedToken: PropTypes.object,
};

export default JourneyTracker;
