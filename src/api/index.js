/* global globalThis */

import useSWR from "swr";
import ky from "ky";
import queryString from "query-string";
import constructUrl from "@iamnapo/construct-url";

import { jwt } from "#utils";

const kyInstance = ky.extend({
	timeout: false,
	prefixUrl: constructUrl(import.meta.env.VITE_MAIN_SERVER_URL),
	retry: {
		statusCodes: [401, 408, 413, 429, 502, 503, 504],
		limit: 2,
		methods: ["get", "post", "put", "head", "delete", "options", "trace"],
	},
	hooks: {
		beforeRequest: [(request) => {
			const token = jwt.getToken();
			const refreshToken = jwt.getRToken();
			if (token) request.headers.set("x-access-token", token);
			if (refreshToken) request.headers.set("x-refresh-token", refreshToken);
		}],
	},
	...(import.meta.env.VITE_SENTRY_ENVIRONMENT === "develop" ? { cache: "no-store" } : {}), // This disables caching
});

const rootApi = kyInstance.extend({
	hooks: {
		beforeRetry: [
			async ({ request: { method }, error }) => {
				if (error?.response?.status === 401) {
					const res = await kyInstance.extend({ throwHttpErrors: false, retry: 0 }).get("api/refresh");
					if (res.status === 401) {
						jwt.destroyTokens();
						globalThis.location.href = "/";
					} else {
						const { token } = await res.json();
						jwt.setToken(token);
					}
				} else if (method === "POST") {
					throw error;
				}
			},
		],
	},
});

const api = {
	get: (path, searchParams) => rootApi.get(path, { searchParams: queryString.stringify(searchParams) }).json(),
	post: (path, json, searchParams) => rootApi.post(path, { json, searchParams }).json(),
	put: (path, json, searchParams) => rootApi.put(path, { json, searchParams }).json(),
	patch: (path, json, searchParams) => rootApi.patch(path, { json, searchParams }).json(),
	delete: (path, json, searchParams) => rootApi.delete(path, { json, searchParams }).json(),
};

export default api;

const is = (data, error) => ({ isLoading: !error && !data, isError: Boolean(error) });

//* ------------------------------- GET Requests using SWR -------------------------------

export const useOrderOwner = (user) => {
	const url = `api/orders/user/${user}/owner`;
	const { data, error, mutate } = useSWR(url);
	return { userOrders: data, ...is(data, error), mutate };
}

export const useOrderAssignees = (orderId) => {
	const url = `api/orders/${orderId}/users`;
	const { data, error, mutate } = useSWR((orderId) ? [url] : null, () => api.get(url));
	return { data, ...is(data, error), mutate };
}

export const useOrganization = (orgId) => {
	const url = `api/panorama/organizations/${orgId}/`;
	const { data, error, mutate } = useSWR((orgId) ? [url] : null, () => api.get(url));
	const isLoading = orgId ? !data && !error : false; // the is Loading will return true only if there is orgId
	const isError  = Boolean(error);
	return { data, isLoading, isError, mutate };
};

//* -------------------------------------------------------------------------------------

//* ----------------------------------- POST Requests -----------------------------------

export const checkAssignees = (users) => api.post("api/configurator/users/validate-users", { users });
export const notifyAssignee = (assignee, assigner, type) => api.post("api/configurator/notify", { assignee, assigner, type });
export const manageSubscription = (stripeCustomerId, orderId) => api.post("api/configurator/subscription/manage-subscription", { stripeCustomerId, orderId });

export const registerJourney = ({ pageKey, group }) => api.post("api/panorama/users/register-journey", { pageKey, group });

//* -------------------------------------------------------------------------------------

//* ------------------------------------ PUT Requests -----------------------------------
export const activateUserOrder = (transactionId, organizationName) => api.put("api/orders/activate", { transactionId, organizationName });
export const updateUserOrder = (orderId, companionAssignees, panoramaAssignees, tddAssignees, nis2Assignees, projectManagementAssigness) => api.put(`api/orders/${orderId}`, { companionAssignees, panoramaAssignees, tddAssignees, nis2Assignees, projectManagementAssigness });

//* -------------------------------------------------------------------------------------
