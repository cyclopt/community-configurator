/* global globalThis */

import { memo, useEffect, useMemo, useState, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { Typography, Grid, TextField, Button, Divider, Box, Select, MenuItem, Autocomplete, LinearProgress } from "@mui/material";
import { PinkContainedButton, PrimaryOutlinedButton } from "../components/Button.jsx"
import Tooltip from "../components/Tooltip.jsx"
import Spinner from "../components/Spinner.jsx";
import PurchasesModal from "../components/PurchasesModal.jsx";
import AssigneesTable from "../components/AssigneesTable.jsx"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";
import { jwt, useSnackbar, dayjs, DATE_FORMAT, capitalize } from "#utils";
import { useOrderOwner, useOrderAssignees, updateUserOrder, checkAssignees, notifyAssignee,
	useOrganization, manageSubscription } from "../api/index.js";
import { useImmer } from "use-immer";
import constructUrl from "@iamnapo/construct-url";

const Subscription = () => {
	const { id: userId, username: name, type: gitType } = jwt.decode();
	const theme = useTheme();

	const { success, error } = useSnackbar();
	const navigate = useNavigate();
	const { search /*, pathname */ } = useLocation();
	const { userOrders = [], isLoading: isLoadingOrder, isError: isErrorOrder, mutate: mutateOrders } = useOrderOwner(userId);
	const [selectedOrder, setSelectedOrder] = useState();
	const { data: organizationData = [],
		isLoading: isOrganizationLoading,
		isError: isOrganizationError,
		mutate: mutateOrganizations } = useOrganization(selectedOrder?.assignments?.organization?._id);
	const [inputCompanionMember, setInputCompanionMember] = useImmer({ username: "", type: gitType, isDeleted: false });
	const [inputPanoramaMember, setInputPanoramaMember] = useImmer({ username: "", type: gitType, isDeleted: false });
	const [inputTddMember, setInputTddMember] = useImmer({ username: "", assignedReports: 0, generatedReports: 0, type: gitType, isDeleted: false });
	const [inputNis2Member, setInputNis2Member] = useImmer({ username: "", assignedReports: 0, generatedReports: 0, type: gitType, isDeleted: false });
	const [inputProjectManagementMember, setInputProjectManagementMember] = useImmer({ username: "", type: gitType, isDeleted: false });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [managePlanIsLoading, setManagePlanIsLoading] = useState(false);

	const { data: assignees = {}, isLoading: isLoadingAssignees, isError: isErrorAssignees, mutate: mutateAssignees } = useOrderAssignees(selectedOrder?._id);
	const [initialCompanionGroup, setInitialCompanionGroup] = useImmer([]);
	const [companionGroup, setCompanionGroup] = useImmer([]);
	const [initialPanoramaGroup, setInitialPanoramaGroup] = useImmer([])
	const [panoramaGroup, setPanoramaGroup] = useImmer([]);
	const [initialTddGroup, setInitialTddGroup] = useImmer([]);
	const [initialNis2Group, setInitialNis2Group] = useImmer([]);
	const [initialProjectManagementGroup, setInitialProjectManagementGroup] = useImmer([]);
	const [tddGroup, setTddGroup] = useImmer([]);
	const [nis2Group, setNis2Group] = useImmer([]);
	const [projectManagementGroup, setProjectManagementGroup] = useImmer([]);
	const [openReportModal, setOpenReportModal] = useState(false);
	const [buyTddReports, setBuyTddReports] =  useState(1);
	const [buyNis2Reports, setBuyNis2Reports] =  useState(1);
	const [isForTddReports, setIsForTddReports] = useState(false);
	const [isForNis2Reports, setIsForNis2Reports] = useState(false);
	const [isForCompanion, setIsForCompanion] = useState(false);
	const [isForPanorama, setIsForPanorama] = useState(false);
	const [recurrenceValue, setRecurrenceValue] = useState('monthly');

	const firstItemRef = useRef(null);

	const totalSubscriptionAmount = useMemo(() => {
		if (Object.keys(selectedOrder ?? {}).length > 0) {
			const companionAmount = selectedOrder?.subscription?.companion?.payment?.amount ?? 0;
			const panoramaAmount = selectedOrder?.subscription?.panorama?.payment?.amount ?? 0;
			const apiAmount = selectedOrder?.subscription?.services?.api?.payment?.amount ?? 0;
			const guardAmount = selectedOrder?.subscription?.services?.cycloptGuard?.payment?.amount ?? 0;
			const projectManagementAmount = selectedOrder?.subscription?.services?.projectManagement?.payment?.amount ?? 0;

			return companionAmount + panoramaAmount + apiAmount + guardAmount + projectManagementAmount
		}

		return 0 
	}, [selectedOrder]);

	const totalOneOffAmount = useMemo(() => {
		const tddAmount = selectedOrder?.subscription?.services?.tdd?.payment?.amount ?? 0;
		const nis2Amount = selectedOrder?.subscription?.services?.nis2?.payment?.amount ?? 0;
		return tddAmount + nis2Amount;
	}, [selectedOrder])

	const onSubmit = async (e) => {
		e.preventDefault();

		try {
			setIsSubmitting(true);
			// Find which users have been assigned and deassigned to send the appropriate emails
			const removedCompanionAssignees = companionGroup.filter((curUsr) => initialCompanionGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted);
			const addedCompanionAssignees = companionGroup.filter((curUsr) => !initialCompanionGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted);
			const removedPanoramaAssignees = panoramaGroup.filter((curUsr) => initialPanoramaGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted);
			const addedPanoramaAssignees = panoramaGroup.filter((curUsr) => !initialPanoramaGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted);
			const removedTddAssignees = tddGroup.filter((curUsr) => initialTddGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted);
			const addedTddAssignees = tddGroup.filter((curUsr) => !initialTddGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted);
			const removedNis2Assignees = nis2Group.filter((curUsr) => initialNis2Group.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted);
			const addedNis2Assignees = nis2Group.filter((curUsr) => !initialNis2Group.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted);
			const removedProjectManagementAssignees = projectManagementGroup.filter((curUsr) => initialProjectManagementGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted);
			const addedProjectManagementAssignees = projectManagementGroup.filter((curUsr) => !initialProjectManagementGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted);

			// Notify the assignees of the changes
			for (const usr of [...removedCompanionAssignees, ...addedCompanionAssignees]) {
				notifyAssignee(usr, name, "Companion");
			}
			for (const usr of [...removedPanoramaAssignees, ...addedPanoramaAssignees]) {
				notifyAssignee(usr, name, "Panorama");
			}
			for (const usr of [...removedTddAssignees, ...addedTddAssignees]) {
				notifyAssignee(usr, name, "Technical Due Diligence");
			}
			for (const usr of [...removedNis2Assignees, ...addedNis2Assignees]) {
				notifyAssignee(usr, name, "Nis2");
			}
			for (const usr of [...removedProjectManagementAssignees, ...addedProjectManagementAssignees]) {
				notifyAssignee(usr, name, "Project Management");
			}

			// Create an organization, assign users and subscription to it
			const companionAssignees = companionGroup.filter((assignee) => assignee.isValid && !assignee.isDeleted);
			const panoramaAssignees = panoramaGroup.filter((assignee) => assignee.isValid && !assignee.isDeleted);
			const tddAssignees = tddGroup.filter((assignee) => assignee.isValid && !assignee.isDeleted);
			const nis2Assignees = nis2Group.filter((assignee) => assignee.isValid && !assignee.isDeleted);
			const projectManagementAssignees = projectManagementGroup.filter((assignee) => assignee.isValid && !assignee.isDeleted);

			// const tddAssigneesIds = tddAssignees.map((validAssignee) => validAssignee._id);
			await updateUserOrder(selectedOrder._id, companionAssignees, panoramaAssignees, tddAssignees, nis2Assignees, projectManagementAssignees);
			// in case the organization has already been created we need to update the memebers of it
			mutateOrders();
			mutateOrganizations();
			mutateAssignees();

			setInitialCompanionGroup(companionAssignees);
			setCompanionGroup(companionAssignees);
			setInitialPanoramaGroup(panoramaAssignees);
			setPanoramaGroup(panoramaAssignees);
			setInitialTddGroup(tddAssignees);
			setInitialNis2Group(nis2Assignees);
			setInitialProjectManagementGroup(projectManagementAssignees)
			setInitialTddGroup(tddAssignees);
			setTddGroup(tddAssignees);
			setNis2Group(nis2Assignees);
			setProjectManagementGroup(projectManagementAssignees)
			setIsSubmitting(false);

			// construct message
			const changes = [];
			if([...removedCompanionAssignees, ...addedCompanionAssignees].length > 0) changes.push("Companion");
			if([...removedPanoramaAssignees, ...addedPanoramaAssignees].length > 0) changes.push("Panorama");
			if([...removedTddAssignees, ...addedTddAssignees].length > 0) changes.push("Technical Due Diligence");
			if([...removedNis2Assignees, ...addedNis2Assignees].length > 0) changes.push("Nis2");
			success(`${changes.join(" and ")} assignees have been notified!`);

		} catch (_error) {
			setIsSubmitting(false);
			const errorMsg = await _error.response.text() ?? "Oops, something went wrong ";
			error(errorMsg);
		}
	}

	useEffect(() => {
		const parsed = queryString.parse(search);

		const findSpecificOrder = userOrders.find((order) => order._id.toString() === parsed.orderId?.toString());
		if (findSpecificOrder) {
			setSelectedOrder(findSpecificOrder);
		}
	}, [search, userOrders]);

	useEffect(() => {
		if (isErrorOrder || isErrorAssignees || isOrganizationError) error();
	}, [isErrorOrder, error, isErrorAssignees, isOrganizationError]);

	const isLoading = useMemo(() => {
		// when users orders are being loaded or an update on exsiting order is being submitted
		if (isLoadingOrder || isSubmitting) return true;
		if (selectedOrder && (isOrganizationLoading || isLoadingAssignees)) return true;
		return false;
	}, [isLoadingAssignees, isLoadingOrder, isOrganizationLoading, isSubmitting, selectedOrder]);

	// Track if the current assignments of an order are the same withs initial one
	const areAssignmentsTheSame = useMemo(() => {
		return (companionGroup.filter((curUsr) => initialCompanionGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted).length === 0
			&& companionGroup.filter((curUsr) => !initialCompanionGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted).length ===0
			&& panoramaGroup.filter((curUsr) => initialPanoramaGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted).length === 0
			&& panoramaGroup.filter((curUsr) => !initialPanoramaGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted).length === 0
			&& tddGroup.filter((curUsr) => initialTddGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted).length === 0
			&& tddGroup.filter((curUsr) => !initialTddGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted).length === 0
			&& nis2Group.filter((curUsr) => initialNis2Group.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted).length === 0
			&& nis2Group.filter((curUsr) => !initialNis2Group.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted).length === 0
			&& projectManagementGroup.filter((curUsr) => initialProjectManagementGroup.some((initUsr) => curUsr.username === initUsr.username) && curUsr.isDeleted).length === 0
			&& projectManagementGroup.filter((curUsr) => !initialProjectManagementGroup.some((initUsr) => curUsr.username === initUsr.username) && !curUsr.isDeleted).length === 0
		)
	}, [companionGroup, initialCompanionGroup, initialNis2Group, initialPanoramaGroup, initialProjectManagementGroup, initialTddGroup, nis2Group, panoramaGroup, projectManagementGroup, tddGroup]);

	// update companion, panorama and tdd groups when the assignees are loaded
	useEffect(() => {
		if (assignees?.companionUsers) {
			const inputGroup = assignees.companionUsers.map((m) => ({ ...m, isValid: true, isDeleted: false }));
			setInitialCompanionGroup(inputGroup);
			setCompanionGroup(inputGroup);
		}

		// get the information about administration from organization members
		if (assignees?.panoramaUsers) {
			const inputGroup = assignees.panoramaUsers.map((m) => {
				return { ...m, isValid: true, isDeleted: false };
			});
			setInitialPanoramaGroup(inputGroup);
			setPanoramaGroup(inputGroup);
		}

		if (assignees?.tddUsers) {
			const inputGroup = assignees.tddUsers.map((m) => {
				return { ...m, isValid: true, isDeleted: false };
			});
			setInitialTddGroup(inputGroup);
			setTddGroup(inputGroup);
		}

		if (assignees?.nis2Users) {
			const inputGroup = assignees.nis2Users.map((m) => {
				return { ...m, isValid: true, isDeleted: false };
			});
			setInitialNis2Group(inputGroup);
			setNis2Group(inputGroup);
		}

		if (assignees?.projectManagementUsers) {
			const inputGroup = assignees?.projectManagementUsers?.map((m) => {
				return { ...m, isValid: true, isDeleted: false };
			});

			setInitialProjectManagementGroup(inputGroup);
			setProjectManagementGroup(inputGroup);
		}
	}, [assignees, organizationData.members, setCompanionGroup, setInitialCompanionGroup, setInitialPanoramaGroup,
		setPanoramaGroup, setInitialTddGroup, setTddGroup, setNis2Group, setInitialNis2Group,
		setInitialProjectManagementGroup, setProjectManagementGroup]);

	// store how many companion assignments are available
	const remainingCompanionUsers = useMemo(() => {
		return selectedOrder?.subscription?.companion?.seats - companionGroup.filter((assignee) => assignee.isValid && !assignee.isDeleted).map((validAssignee) => validAssignee._id).length
	}, [companionGroup, selectedOrder?.subscription?.companion?.seats]);

	// store how many panorama assignments are available
	const remainingPanoramaUsers = useMemo(() => {
		return selectedOrder?.subscription?.panorama?.seats - panoramaGroup.filter((assignee) => assignee.isValid && !assignee.isDeleted).map((validAssignee) => validAssignee._id).length
	}, [selectedOrder?.subscription?.panorama?.seats, panoramaGroup]);

	useEffect(() => {
		const parsed = queryString.parse(search);
		const selectedId = parsed.selectedOrderId;

		if (!isLoading) {
			if (selectedId && userOrders.length > 0) {
				const foundOrder = userOrders.find(order => order._id.toString() === selectedId);
				if (foundOrder && selectedOrder?._id !== foundOrder._id) {
					setSelectedOrder(foundOrder);
				}
			}
		
			navigate(queryString.stringifyUrl({ url: "/home", query: parsed }), { replace: true });
		}
		// ! DONT TOUCH DEPENDENCIES
	}, [search, isLoading, selectedOrder, isSubmitting, userOrders]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const parsed = queryString.parse(search);
		const successQuery = parsed?.success ?? null;
		delete parsed.success;
		if (Object.keys(selectedOrder ?? {}).length > 0 && !managePlanIsLoading) {
			if (successQuery && (successQuery === "true")) {
				success("Your subscription has been updated successfully.")
			} else if (successQuery && successQuery === "false") {
				error("Payment failed and your subscription has not been updated. Please try again or contact support.")
			}
			navigate(queryString.stringifyUrl({ url: "/home", query: parsed }));
		}
	}, [error, managePlanIsLoading, navigate, search, selectedOrder, success]);

	const manageOrderSubscription = async (customerID) => {
		try {
			setManagePlanIsLoading(true);
			const { url } = await manageSubscription(customerID, selectedOrder._id);
			if (url) {
				globalThis.location.href = url;
			}
		} catch {
			error("Something went wrong")
		}
		setManagePlanIsLoading(false);
	};

	const allProducts = useMemo(() => {
		if (!selectedOrder) return [];

		const subscription = selectedOrder.subscription;

		return [
			{
				key: 'panorama',
				name: 'Cyclopt Panorama',
				type: 'seats',
				seats: subscription?.panorama?.seats || 0,
				hasBeenBought: subscription?.panorama?.seats > 0 &&
					subscription?.panorama?.payment?.validUntil != null &&
					subscription?.panorama?.payment?.paidAt != null,
				isActive:
					subscription?.panorama?.isActive &&
					new Date(subscription.panorama.payment.validUntil) > new Date(),
			},
			{
				key: 'companion',
				name: 'Cyclopt Companion',
				type: 'seats',
				seats: subscription?.companion?.seats || 0,
				hasBeenBought: subscription?.companion?.seats > 0 &&
					subscription?.companion?.payment?.validUntil != null &&
					subscription?.companion?.payment?.paidAt != null,
				isActive:
					subscription?.companion?.isActive &&
					new Date(subscription.companion.payment.validUntil) > new Date(),
			},
			{
				key: 'api',
				name: 'Cyclopt API',
				type: 'flag',
				hasBeenBought: subscription.services?.api?.payment?.validUntil != null &&
					subscription.services?.api?.payment?.paidAt != null,
				isActive:
					subscription.services?.api?.isActive &&
					new Date(subscription.services.api.payment.validUntil) > new Date()
			},
			{
				key: 'guard',
				name: 'Cyclopt Guard',
				type: 'flag',
				hasBeenBought: subscription.services?.cycloptGuard?.payment?.validUntil != null &&
					subscription.services?.cycloptGuard?.payment?.paidAt != null,
				isActive:
					subscription.services?.cycloptGuard?.isActive &&
					new Date(subscription.services.cycloptGuard.payment.validUntil) > new Date()
			},
			{
				key: 'projectManagement',
				name: 'Cyclopt Project Management',
				type: 'flag',
				hasBeenBought: subscription.services?.projectManagement?.payment?.validUntil != null &&
					subscription.services?.projectManagement?.payment?.paidAt != null,
				isActive:
					subscription.services?.projectManagement?.isActive &&
					new Date(subscription.services.projectManagement.payment.validUntil) > new Date()
			},
			{
				key: 'tdd',
				name: 'Cyclopt TDD',
				type: 'report',
				hasBeenBought: false, // Always show TDD, so this is set to false
				isActive: false, // Always show TDD, so this is set to false
			},
			{
				key: 'nis2',
				name: 'Cyclopt NIS2',
				type: 'report',
				hasBeenBought: false, // Always show NIS2, so this is set to false
				isActive: false, // Always show NIS2, so this is set to false
			},
		];
	}, [selectedOrder]);

	const activeProducts = useMemo(() => {
		return allProducts.filter((product) => product.isActive);
	}, [allProducts]);

	// Products that have been bought before but their subscription hase been expred
	// Add those in the expired products section
	const expiredProducts = useMemo(() => {
		return allProducts.filter((product) => product.hasBeenBought && !product.isActive);
	}, [allProducts]);

	// Products that have not been bought previously in the order
	// so they can be added in the corresponding field
	// tdd and nis2 are always added in this list
	const productsThatCanBeAdded = useMemo(() => {
		return allProducts.filter((product) => !product.hasBeenBought);
	}, [allProducts])

	const isCompanionEnabled = useMemo(() => {
		const subscription = allProducts.find((prod) => prod.key === "companion");
		return subscription?.isActive && subscription?.hasBeenBought;
	}, [allProducts]);

	const isPanoramaEnabled = useMemo(() => {
		const subscription = allProducts.find((prod) => prod.key === "panorama");
		return subscription?.isActive && subscription?.hasBeenBought;
	}, [allProducts]);

	const isApiEnabled = useMemo(() => {
		const subscription = allProducts.find((prod) => prod.key === "api");
		return subscription?.isActive && subscription?.hasBeenBought;
	}, [allProducts]);

	const isGuardEnabled = useMemo(() => {
		const subscription = allProducts.find((prod) => prod.key === "guard");
		return subscription?.isActive && subscription?.hasBeenBought;
	}, [allProducts]);

	const isTddEnabled = useMemo(() => {
		if (Object.keys(selectedOrder ?? {}).length > 0) {
			return selectedOrder?.subscription?.services?.tdd?.isActive && selectedOrder?.subscription?.services?.tdd?.reports > 0;
		}

		return null
	}, [selectedOrder]);

	const isNis2Enabled = useMemo(() => {
		if (Object.keys(selectedOrder ?? {}).length > 0) {
			return selectedOrder?.subscription?.services?.nis2?.isActive && selectedOrder?.subscription?.services?.nis2?.reports > 0;
		}

		return null
	}, [selectedOrder]);

	const isProjectManagementEnabled = useMemo(() => {
		if (Object.keys(selectedOrder ?? {}).length > 0) {
			return selectedOrder?.subscription?.services?.projectManagement?.isActive;
		}

		return null
	}, [selectedOrder]);

	useEffect(() => {
		const periods = [
			selectedOrder?.subscription?.companion?.payment?.period,
			selectedOrder?.subscription?.panorama?.payment?.period,
			selectedOrder?.subscription?.services?.api?.payment?.period,
			selectedOrder?.subscription?.services?.cycloptGuard?.payment?.period,
			selectedOrder?.subscription?.services?.projectmanagement?.payment?.period,
		];

		const firstValidPeriod = periods.find(Boolean);
		if (firstValidPeriod) {
			setRecurrenceValue(firstValidPeriod === "yearly" ? "annually" : "monthly");
		}
	}, [selectedOrder]);

	const tddOrNis2Exist = useMemo(() => {
		if (selectedOrder?.subscription?.services?.tdd?.reports > 0 || selectedOrder?.subscription?.services?.nis2?.reports > 0) {
			return true;
		}

		return false
	},[selectedOrder]);

	const manageServicesPurchases = async (service) => {
		setManagePlanIsLoading(true);
		try {
			const baseData = {
				fullName: selectedOrder.invoiceInfo.name,
				email: selectedOrder.invoiceInfo.email,
				recurrence: recurrenceValue,
				invoice: selectedOrder.invoiceInfo.isInvoice ?? null,
				companyName: selectedOrder.invoiceInfo.companyName ?? null,
				country: selectedOrder.invoiceInfo.country ?? null,
				countryCode: selectedOrder.invoiceInfo.countryCode ?? null,
				address: selectedOrder.invoiceInfo.address ?? null,
				postalCode: selectedOrder.invoiceInfo.postalCode ?? null,
				vat: selectedOrder.invoiceInfo.vatNumber ?? null,
				orderId: selectedOrder._id,
				dbCustomerId: selectedOrder.stripeCustomerId,
			};

			switch(service) {
			case "api": {
				setIsForPanorama(true);
				baseData.apiSelected = true;
				baseData.total = recurrenceValue === "monthly" ? 10 : (10 * 10);
				break;
			}
			case "guard": {
				baseData.guardSelected = true;
				baseData.total = recurrenceValue === "monthly" ? 10 : (10 * 10);
				break;
			}
			case "projectManagement": {
				baseData.projectManagementSelected = true;
				baseData.total = recurrenceValue === "monthly" ? 50 : (50 * 10);
				break;
			}
			default:
			}
	
			const parsed = queryString.parse(search);
			delete parsed.success;
			navigate(queryString.stringifyUrl({ url: "/home", query: parsed }));
			const res = await fetch(
				constructUrl(import.meta.env.VITE_MAIN_SERVER_URL, "api/pricing/payment"),
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(baseData),
				}
			);
			const { success, message, url } = await res.json();
			success ? (globalThis.location.href = url) : error(message);
		} catch (error_) {
			error(error_.message || "Unexpected error.");
		}
		setManagePlanIsLoading(false);
	};

	return (
		<>
			{(isLoading || managePlanIsLoading) && <LinearProgress /> }
			<section style={{ paddingTop: "1rem" }}>
				<div className="container">
					<Grid sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
						<Typography variant="h4">{"Manage orders"}</Typography>
					</Grid>
					<Grid container sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", pb: "1rem", pt: "1rem", gap: "1rem" }}>
						<Grid item display="flex" flexDirection="column" minWidth="30%" gap="0.5rem" sx={{width: 400}}>
							<Typography variant="h6">
								{"Select order:"}
							</Typography>
							<Autocomplete
								disablePortal
								disabled={isLoading}
								size="small"
								renderInput={(params) => (
									<Tooltip title="All your unsaved changes will be lost if you select another subscription!" disabled={!(selectedOrder && !areAssignmentsTheSame)}>
										<TextField
											{...params}
											color="secondary"
											error={!areAssignmentsTheSame}
											placeholder="Select an existing order..."
										/>
									</Tooltip>

								)}
								renderOption={(props, option) => (
									<li
										{...props}
										key={option._id}
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "flex-start",
											textAlign: "left",
											width: "100%",
										}}
									>
										<span>{option.assignments?.organization?.name}</span>
										<span style={{ fontSize: '0.8rem', color: '#888' }}>
											{" key:"} {option.transactionId}
										</span>
									</li>
								)}

								id="labels"
								value={selectedOrder ?? null} // should be a value from the options array or null
								options={
									userOrders.filter((order) => order.assignments?.organization?.name)
								}
								isOptionEqualToValue={(option, value) => option._id === value._id}
								getOptionLabel={(option) => option.assignments?.organization?.name  || ""}
								onChange={(_, selectedOption) => {
									const parsed = queryString.parse(search);
									if (parsed.selectedOrderId) {
										delete parsed.selectedOrderId;
										navigate(queryString.stringifyUrl({ url: location.pathname, query: parsed }));
									}

									if (parsed.orderId) {
										delete parsed.orderId;
										navigate(queryString.stringifyUrl({ url: location.pathname, query: parsed }));
									}

									if (!selectedOption) {
										setCompanionGroup([]);
										setInitialCompanionGroup([]);
										setPanoramaGroup([]);
										setInitialPanoramaGroup([]);
										setTddGroup([]);
										setInitialTddGroup([]);
										setNis2Group([]);
										setInitialNis2Group([]);
										setProjectManagementGroup([]);
										setInitialProjectManagementGroup([]);
									}

									setInputCompanionMember({ username: "", type: gitType, isDeleted: false });
									setInputPanoramaMember({ username: "", type: gitType, isDeleted: false });
									setInputTddMember({ username: "", assignedReports: 0, generatedReports: 0, type: gitType, isDeleted: false });
									setInputNis2Member({ username: "", assignedReports: 0, generatedReports: 0, type: gitType, isDeleted: false });
									setSelectedOrder(selectedOption);
								}}
							/>
						</Grid>
						<Grid item>
							<PrimaryOutlinedButton
								id="subscriptionActivation-1"
								className="activateButton"
								variant="contained"
								color="primary"
								size="medium"
								disabled={isLoading}
								title="Activate New Order"
								onClick={() => {
									navigate("/activate-order");
								}}
							/>
						</Grid>
					</Grid>
					<Divider sx={{border: 1, color:  theme.palette.cardBackgroundDark.main}} />
					{
						selectedOrder && (
							<Grid>
								<Grid container id="subscriptionDetails" direction="column" sx={{pt: "1rem", pb: "1rem"}}>
									<Grid container gap={2} sx={{ display: "flex"}}>
										<Grid item sx={{pb: "0.5rem"}} ref={firstItemRef}>
											<Typography variant="h5" sx={{fontWeight: "bold", pb: "0.5rem"}}>{"Plan Details"}</Typography>
											<Grid sx={{pb: 2}}>
												<Grid
													sx={{
														borderLeft: `10px solid ${theme.palette.primary.main}`,
														borderRadius: "8px",
														cursor: "default",
														backgroundColor: theme.palette.common.white,
														px: 2,
														py: 1,
													}}
												>
													<Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
														<Typography sx={{ fontWeight: "bold",  variant: "h6" }}>
															{" Active Plan"}
														</Typography>

														{activeProducts?.length > 0 && (
															<>
																{activeProducts.map((p) => (
																	<Typography key={p.key}>{`${p.name} ${ p.type === "seats" ? `/ ${p.seats}` : ""} ${p.type === "seats" ? "seats" : ""}`}</Typography>
																))}
															</>
														)}
													</Box>

												</Grid>
											</Grid>
											<Box sx={{backgroundColor: theme.palette.cardBackgroundLight.main, p: 1}}>
												{activeProducts?.length > 0 ? (
													<>
														<Typography variant="h8" sx={{ fontWeight: 'bold', paddingTop: 1 }}>{"Next payment"}</Typography>
														{/* Companion seats*/}
														{isCompanionEnabled && (
															<Typography>
																<Box component="span">
																	{"Cyclopt companion"}
																</Box>
																{" on "}
																{recurrenceValue === "annually" ? dayjs(selectedOrder.subscription.companion?.payment?.paidAt)
																	.add(1, "year")
																	.format(DATE_FORMAT)
																	: dayjs(selectedOrder.subscription.companion?.payment?.paidAt)
																		.add(1, "month")
																		.format(DATE_FORMAT)}
															</Typography>
														)}
														{/* Panorama seats*/}
														{isPanoramaEnabled && (
															<Typography>
																<Box component="span">
																	{" Cyclopt panorama"}
																</Box>
																{" on "}
																{recurrenceValue === "annually" ? dayjs(selectedOrder.subscription.panorama?.payment?.paidAt)
																	.add(1, "year")
																	.format(DATE_FORMAT)
																	: dayjs(selectedOrder.subscription.panorama?.payment?.paidAt)
																		.add(1, "month")
																		.format(DATE_FORMAT)}
															</Typography>
														)}
														{/* API */}
														{isApiEnabled && (
															<Typography>
																<Box component="span">
																	{"Cyclopt API"}
																</Box>
																{" on "}
																{recurrenceValue === "annually" ? dayjs(selectedOrder.subscription.services?.api?.payment?.paidAt)
																	.add(1, "year")
																	.format(DATE_FORMAT)
																	: dayjs(selectedOrder.subscription.services?.api?.payment?.paidAt)
																		.add(1, "month")
																		.format(DATE_FORMAT)}
															</Typography>
														)}
														{/* Guard */}
														{isGuardEnabled && (
															<Typography>
																<Box component="span">
																	{"Cyclopt guard"}
																</Box>
																{" on "}
																{recurrenceValue === "annually" ? dayjs(selectedOrder.subscription.services?.cycloptGuard?.payment?.paidAt)
																	.add(1, "year")
																	.format(DATE_FORMAT)
																	: dayjs(selectedOrder.subscription.services?.cycloptGuard?.payment?.paidAt)
																		.add(1, "month")
																		.format(DATE_FORMAT)}
															</Typography>
														)}
														{/* Project Management */}
														{isProjectManagementEnabled && (
															<Typography>
																<Box component="span">
																	{"Cyclopt Project Management"}
																</Box>
																{" on "}
																{recurrenceValue === "annually" ? dayjs(selectedOrder.subscription.services?.projectManagement?.payment?.paidAt)
																	.add(1, "year")
																	.format(DATE_FORMAT)
																	: dayjs(selectedOrder.subscription.services?.projectManagement?.payment?.paidAt)
																		.add(1, "month")
																		.format(DATE_FORMAT)}
															</Typography>
														)}

														<Grid sx={{ pt: 1 }}>
															<Typography  variant="h8" sx={{ fontWeight: 'bold', paddingTop: 1 }}>
																{"Amount paid for all the subscriptions"}
															</Typography>
															<Typography>
																{`€${totalSubscriptionAmount}`}
																{selectedOrder?.stripeCustomerId && (
																	recurrenceValue === "monthly" ? " /monthly" : " /annually"
																)}
															</Typography>
														</Grid>
													</>
												) : (
													<Typography>{"No active subscriptions found."}</Typography>
												)}
												
											</Box>
											{expiredProducts.length > 0 && (
												<>
													<Grid sx={{ pb: 2, pt: 2 }}>
														<Grid
															sx={{
																borderLeft: `10px solid ${theme.palette.third.main}`,
																borderRadius: "8px",
																cursor: "default",
																backgroundColor: theme.palette.common.white,
																px: 2,
																py: 1,
															}}
														>
															<Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
																<Typography sx={{ fontWeight: "bold", variant: "h6" }}>
																	{" Expired Plan"}
																</Typography>

																{expiredProducts?.length > 0 && (
																	<>
																		{expiredProducts.map((p) => (
																			<Typography key={p.key}>{`${p.name} ${p.type === "seats" ? `/ ${p.seats}` : ""} ${p.type === "seats" ? "seats" : ""}`}</Typography>
																		))}
																	</>
																)}
															</Box>

														</Grid>
													</Grid>
													<Box sx={{ backgroundColor: theme.palette.cardBackgroundLight.main, p: 1 }}>
														<>
															<Typography variant="h8" sx={{ fontWeight: 'bold', paddingTop: 1 }}>{"Expired Dates"}</Typography>
															{expiredProducts?.length > 0 && (
																<>
																	{expiredProducts.map((p) => (
																		<Typography key={p.key}>{`${p.name} on ${dayjs(selectedOrder.subscription.companion?.payment?.paidAt).format(DATE_FORMAT)}`}</Typography>
																	))}
																</>
															)}
														</>

													</Box>
												</>
											)}
											{/* <Typography>{"Annual plan, paid monthly"}</Typography> */}
											<Grid item sx={{paddingTop: 2}}>
												<PrimaryOutlinedButton
													disabled={!selectedOrder?.stripeCustomerId || (selectedOrder?.subscription?.companion?.seats === 0 && selectedOrder?.subscription?.panorama?.seats === 0)}
													className="manageButton"
													variant="outlined"
													color="primary"
													size="medium"
													title={"Manage Your Plan"}
													onClick={async () => { 
														const parsed = queryString.parse(search);
														delete parsed.success;
														navigate(queryString.stringifyUrl({ url: "/home", query: parsed }));
														await manageOrderSubscription(selectedOrder.stripeCustomerId);
													}}
												/>
											</Grid>
										</Grid>
										<Divider orientation="vertical" sx={{ height: "auto", border: 1, color: theme.palette.cardBackgroundDark.main }} />
										<Grid item sx={{ pb: "0.5rem" }}>
											<Typography variant="h5" sx={{ fontWeight: "bold", pb: "0.5rem" }}>
												{" One off Purchases"}
											</Typography>
											{tddOrNis2Exist && (
												<>
													<Grid sx={{ pb: 2 }}>
														<Grid
															sx={{
																borderLeft: `10px solid ${theme.palette.secondary.main}`,
																borderRadius: "8px",
																cursor: "default",
																backgroundColor: theme.palette.common.white,
																px: 2,
																py: 1,
															}}
														>
															{selectedOrder?.subscription?.services?.tdd?.reports > 0 && (
																<Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
																	<Typography sx={{ fontWeight: "bold", mr: "0.2rem", textAlign: "right" }}>
																		{" Cyclopt Technical Due Diligence:"}
																	</Typography>
																	<Typography>
																		{`${selectedOrder?.subscription?.services?.tdd?.remainingReports} / ${selectedOrder?.subscription?.services?.tdd?.reports} reports`}
																	</Typography>
																</Box>
															)}

															{selectedOrder?.subscription?.services?.nis2?.reports > 0 && (
																<Box sx={{ display: "flex", width: "100%" }}>
																	<Typography sx={{ fontWeight: "bold", mr: "0.2rem", textAlign: "right" }}>
																		{" Cyclopt Nis2:"}
																	</Typography>
																	<Typography>
																		{`${selectedOrder?.subscription?.services?.nis2?.remainingReports} / ${selectedOrder?.subscription?.services?.nis2?.reports} reports`}
																	</Typography>
																</Box>
															)}

														</Grid>
													</Grid>
														
												</>
											)}
											<Grid>
												<Box sx={{ backgroundColor: theme.palette.cardBackgroundLight.main, p: 1 }}>
													{(selectedOrder?.subscription?.services?.tdd?.reports > 0 || selectedOrder?.subscription?.services?.nis2?.reports > 0) ? (
														<>
															<Typography sx={{ fontWeight: 'bold', paddingTop: 1 }}>{"Amount paid for one-off purchases:"}</Typography>
															<Typography>{`€${totalOneOffAmount}`}</Typography>
														</>
													) : (
														<Typography sx={{ fontWeight: 'bold', paddingTop: 1 }}>{"No active one-off purchases found"}</Typography>
													)}
												</Box>
											</Grid>
										</Grid>
										{selectedOrder?.stripeCustomerId && (
											<>
												<Divider orientation="vertical" sx={{ height: "auto", border: 1, color:  theme.palette.cardBackgroundDark.main }} />
												<Grid item sx={{ pb: "0.5rem" }}>
													<Typography variant="h5" sx={{ fontWeight: "bold", pb: "0.5rem" }}>{"Add Product"}</Typography>
													{productsThatCanBeAdded?.length > 0 && (
														<>
															<Box sx={{ backgroundColor: theme.palette.cardBackgroundLight.main, pt: 1, pb: 1 }}>
																{productsThatCanBeAdded.map(p => (
																	<Box key={p.key} sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 2 }}>
																		<Typography>{p.name}</Typography>
																		<Button
																			sx={{ minWidth: '1px', '&:hover': { backgroundColor: 'inherit' } }}
																			size="small"
																			startIcon={<AddCircleOutlineIcon sx={{ color: theme.palette.secondary.main }} />}
																			onClick={async () => {
																				switch (p.key.toString().trim()) {
																				case 'panorama': {
																					setIsForPanorama(true);
																					setOpenReportModal(true);
																					break;
																				}
																				case 'companion': {
																					setIsForCompanion(true);
																					setOpenReportModal(true);
																					break;
																				}
																				case 'api': {
																					await manageServicesPurchases("api");
																					break;
																				}
																				case 'guard': {
																					await manageServicesPurchases("guard");
																					break;
																				}
																				case 'tdd': {
																					setIsForNis2Reports(false);
																					setOpenReportModal(true);
																					setIsForTddReports(true);
																					break;
																				}
																				case 'nis2': {
																					setIsForTddReports(false);
																					setOpenReportModal(true);
																					setIsForNis2Reports(true);
																					break;
																				}
																				case 'projectManagement': {
																					{
																						await manageServicesPurchases("projectManagement");
																					}
																					break;
																				}
																				}
																			} } />
																	</Box>
																))}
															</Box>
														</>
													)}
												</Grid>
											</>
										)}
									</Grid>
								</Grid>
								<Divider sx={{border: 1, color:  theme.palette.cardBackgroundDark.main}} />
								{isCompanionEnabled && (
									<>
										<Grid container id="cyclopt-companion-assignees" direction="column" sx={{ pt: "1rem", pb: "1rem" }}>
											<Typography variant="h5" sx={{ fontWeight: "bold" }}>{"Cyclopt Companion Assignees"}</Typography>
											<Typography variant="h6">
												{`Remaining seats:
											${remainingCompanionUsers}
											out of
											${selectedOrder?.subscription.companion.seats}`}
											</Typography>
											<Grid item display="flex" sx={{ pt: "0.5rem", pb: "0.5rem", gap: "1rem" }}>
												<TextField
													fullWidth
													disabled={isLoading || remainingCompanionUsers === 0 || !isCompanionEnabled}
													size="small"
													color="primary"
													name="member"
													id="member"
													value={inputCompanionMember.username || ""}
													placeholder="Member’s username"
													onChange={({ target: { value } }) => setInputCompanionMember((p) => { p.username = value; })}
													onClick={() => {} } />
												{gitType !== "cyclopt" && (
													<Select
														size="small"
														color="primary"
														disabled={isLoading || remainingCompanionUsers === 0 || !isCompanionEnabled}
														value={inputCompanionMember.type}
														onChange={(e) => setInputCompanionMember((p) => { p.type = e.target.value; })}
													>
														<MenuItem value={gitType}>{capitalize(gitType)}</MenuItem>
														<MenuItem value="cyclopt">{"Cyclopt"}</MenuItem>
													</Select>
												)}
												<Button
													className="addButton"
													variant="outlined"
													color="primary"
													size="medium"
													disabled={isLoading || !inputCompanionMember.username || remainingCompanionUsers === 0 || !isCompanionEnabled}
													onClick={async () => {
														try {
														// Validate the input member
															const validationResult = await checkAssignees([inputCompanionMember]);

															if (validationResult.length > 0 && validationResult[0].isValid) {
															// If valid and not already in the group, add it
																if (!companionGroup.some((member) => member.username === inputCompanionMember.username)) {
																	setCompanionGroup((p) => [...p, { ...inputCompanionMember, ...validationResult[0] }]);
																}
																// Reset the input member
																setInputCompanionMember({ username: "", type: gitType });
															} else {
															// Reset the input member
																setInputCompanionMember({ username: "", type: gitType });
																error("Invalid user"); // Show a message indicating the user is invalid
															}
														} catch {
															error(); // Handle any validation error
														}
													} }
												>
													{"Add"}
												</Button>
											</Grid>
											<Grid item>
												<AssigneesTable assignees={companionGroup} setGroup={setCompanionGroup} service={"Companion"} disabled={!isCompanionEnabled}/>
											</Grid>
										</Grid>
										<Divider sx={{ border: 1, color:  theme.palette.cardBackgroundDark.main }} />
									</>
								)}
								{isPanoramaEnabled > 0 && (
									<>
										<Grid sx={{pt: "1rem", pb: "1rem"}}>
											<Typography variant="h5" sx={{fontWeight: "bold"}}>{"Cyclopt Panorama Assignees"}</Typography>
											<Typography variant="h6" >
												{`Remaining seats:
											${remainingPanoramaUsers}
											out of
											${selectedOrder?.subscription.panorama.seats}`
												}
											</Typography>
											<Grid item display="flex" sx={{pt: "0.5rem", pb: "0.5rem", gap: "1rem"}}>
												<TextField
													fullWidth
													disabled={isLoading || remainingPanoramaUsers === 0 || !isPanoramaEnabled}
													size="small"
													color="primary"
													name="member"
													id="member"
													value={inputPanoramaMember.username || ""}
													placeholder="Member’s username"
													onChange={({ target: { value } }) => setInputPanoramaMember((p) => { p.username = value; })}
													onClick={() => {}}
												/>
												{gitType !== "cyclopt" && (
													<Select
														size="small"
														color="primary"
														disabled={isLoading || remainingPanoramaUsers === 0 || !isPanoramaEnabled}
														value={inputPanoramaMember.type}
														onChange={(e) => setInputPanoramaMember((p) => { p.type = e.target.value; })}
													>
														<MenuItem value={gitType}>{capitalize(gitType)}</MenuItem>
														<MenuItem value="cyclopt">{"Cyclopt"}</MenuItem>
													</Select>
												)}
												<Button
													className="addButton"
													variant="outlined"
													color="primary"
													size="medium"
													disabled={isLoading || !inputPanoramaMember.username || remainingPanoramaUsers === 0 || !isPanoramaEnabled}
													onClick={async () => { 
														try {
															// Validate the input member
															const validationResult = await checkAssignees([inputPanoramaMember]);
															if (validationResult.length > 0 && validationResult[0].isValid) {
																// If valid and not already in the group, add it
																if (!panoramaGroup.some((member) => member.username === inputPanoramaMember.username)) {
																	setPanoramaGroup((p) => [...p, { ...inputPanoramaMember, ...validationResult[0]}]);
																}
																// Reset the input member
																setInputPanoramaMember({ username: "", type: gitType });
															} else {
																// Reset the input member
																setInputPanoramaMember({ username: "", type: gitType });
																error("Invalid user"); // Show a message indicating the user is invalid
															}
														} catch {
															error(); // Handle any validation error
														}
													}}
												>
													{"Add"}
												</Button>
											</Grid>
											<Grid item>
												<AssigneesTable assignees={panoramaGroup} setGroup={setPanoramaGroup} service={"Panorama"} disabled={!isPanoramaEnabled} />
											</Grid>
										</Grid>
										<Divider sx={{ border: 1, color:  theme.palette.cardBackgroundDark.main}}/>
									</>
								)}
								{isTddEnabled && (
									<>
										<Grid sx={{pt: "1rem", pb: "1rem"}}>
											<Typography variant="h5" sx={{fontWeight: "bold"}}>{"Cyclopt Technical Due Diligence Assignees"}</Typography>
											<Typography variant="h6" >
												{`Remaining reports for all assignees:
											${selectedOrder?.subscription.services.tdd.remainingReports}
											out of
											${selectedOrder?.subscription.services.tdd.reports}`
												}
											</Typography>
											<Grid item display="flex" sx={{pt: "0.5rem", pb: "0.5rem", gap: "1rem"}}>
												<TextField
													fullWidth
													disabled={isLoading || !isTddEnabled}
													size="small"
													color="primary"
													name="member"
													id="member"
													value={inputTddMember.username || ""}
													placeholder="Member’s username"
													onChange={({ target: { value } }) => setInputTddMember((p) => { p.username = value; })}
													onClick={() => {}}
												/>
												{gitType !== "cyclopt" && (
													<Select
														size="small"
														color="primary"
														disabled={isLoading || !isTddEnabled}
														value={inputTddMember.type}
														onChange={(e) => setInputTddMember((p) => { p.type = e.target.value; })}
													>
														<MenuItem value={gitType}>{capitalize(gitType)}</MenuItem>
														<MenuItem value="cyclopt">{"Cyclopt"}</MenuItem>
													</Select>
												)}
												<Button
													className="addButton"
													variant="outlined"
													color="primary"
													size="medium"
													disabled={isLoading || !inputTddMember.username || !isTddEnabled}
													onClick={async () => { 
														try {
															// Validate the input member
															const validationResult = await checkAssignees([inputTddMember]);
															if (validationResult.length > 0 && validationResult[0].isValid) {
																// If valid and not already in the group, add it
																if (!tddGroup.some((member) => member.username === inputTddMember.username)) {
																	setTddGroup((p) => [...p, { ...inputTddMember, ...validationResult[0], assignedReports: 0, generatedReports: 0}]);
																}
																// Reset the input member
																setInputTddMember({ username: "", type: gitType, assignedReports: 0, generatedReports: 0 });
															} else {
																// Reset the input member
																setInputTddMember({ username: "", type: gitType, assignedReports: 0, generatedReports: 0 });
																error("Invalid user"); // Show a message indicating the user is invalid
															}
														} catch {
															error(); // Handle any validation error
														}
													}}
												>
													{"Add"}
												</Button>
											</Grid>
											<Grid item>
												<AssigneesTable assignees={tddGroup} setGroup={setTddGroup} service={"TDD"} disabled={!isTddEnabled} />
											</Grid>
										</Grid>
										<Divider sx={{ border: 1, color:  theme.palette.cardBackgroundDark.main}}/>
									</>
								)}
								{isNis2Enabled && (
									<>
										<Grid sx={{pt: "1rem", pb: "1rem"}}>
											<Typography variant="h5" sx={{fontWeight: "bold"}}>{"Cyclopt NIS2 Assignees"}</Typography>
											<Typography variant="h6" >
												{`Remaining reports for all assignees:
											${selectedOrder?.subscription.services.nis2.remainingReports}
											out of
											${selectedOrder?.subscription.services.nis2.reports}`
												}
											</Typography>
											<Grid item display="flex" sx={{pt: "0.5rem", pb: "0.5rem", gap: "1rem"}}>
												<TextField
													fullWidth
													disabled={isLoading || !isNis2Enabled}
													size="small"
													color="primary"
													name="member"
													id="member"
													value={inputNis2Member.username || ""}
													placeholder="Member’s username"
													onChange={({ target: { value } }) => setInputNis2Member((p) => { p.username = value; })}
													onClick={() => {}}
												/>
												{gitType !== "cyclopt" && (
													<Select
														size="small"
														color="primary"
														disabled={isLoading || !isNis2Enabled}
														value={inputNis2Member.type}
														onChange={(e) => setInputNis2Member((p) => { p.type = e.target.value; })}
													>
														<MenuItem value={gitType}>{capitalize(gitType)}</MenuItem>
														<MenuItem value="cyclopt">{"Cyclopt"}</MenuItem>
													</Select>
												)}
												<Button
													className="addButton"
													variant="outlined"
													color="primary"
													size="medium"
													disabled={isLoading || !inputNis2Member.username || !isNis2Enabled}
													onClick={async () => { 
														try {
															// Validate the input member
															const validationResult = await checkAssignees([inputNis2Member]);
															if (validationResult.length > 0 && validationResult[0].isValid) {
																// If valid and not already in the group, add it
																if (!nis2Group.some((member) => member.username === inputNis2Member.username)) {
																	setNis2Group((p) => [...p, { ...inputNis2Member, ...validationResult[0], assignedReports: 0, generatedReports: 0}]);
																}
																// Reset the input member
																setInputNis2Member({ username: "", type: gitType, assignedReports: 0, generatedReports: 0 });
															} else {
																// Reset the input member
																setInputNis2Member({ username: "", type: gitType, assignedReports: 0, generatedReports: 0 });
																error("Invalid user"); // Show a message indicating the user is invalid
															}
														} catch {
															error(); // Handle any validation error
														}
													}}
												>
													{"Add"}
												</Button>
											</Grid>
											<Grid item>
												<AssigneesTable assignees={nis2Group} setGroup={setNis2Group} service={"NIS2"} disabled={!isNis2Enabled} />
											</Grid>
										</Grid>
										<Divider sx={{ border: 1, color:  theme.palette.cardBackgroundDark.main}}/>
									</>
								)}
								{isProjectManagementEnabled && (
									<>
										<Grid sx={{pt: "1rem", pb: "1rem"}}>
											<Typography variant="h5" sx={{fontWeight: "bold"}}>{"Project Management Assignees"}</Typography>
											<Grid item display="flex" sx={{pt: "0.5rem", pb: "0.5rem", gap: "1rem"}}>
												<TextField
													fullWidth
													disabled={isLoading || !isProjectManagementEnabled}
													size="small"
													color="primary"
													name="member"
													id="member"
													value={inputProjectManagementMember.username || ""}
													placeholder="Member’s username"
													onChange={({ target: { value } }) => setInputProjectManagementMember((p) => { p.username = value; })}
													onClick={() => {}}
												/>
												{gitType !== "cyclopt" && (
													<Select
														size="small"
														color="primary"
														disabled={isLoading || !isProjectManagementEnabled}
														value={inputProjectManagementMember.type}
														onChange={(e) => setInputProjectManagementMember((p) => { p.type = e.target.value; })}
													>
														<MenuItem value={gitType}>{capitalize(gitType)}</MenuItem>
														<MenuItem value="cyclopt">{"Cyclopt"}</MenuItem>
													</Select>
												)}
												<Button
													className="addButton"
													variant="outlined"
													color="primary"
													size="medium"
													disabled={isLoading || !inputProjectManagementMember.username || !isProjectManagementEnabled}
													onClick={async () => { 
														try {
															// Validate the input member
															const validationResult = await checkAssignees([inputProjectManagementMember]);
															if (validationResult.length > 0 && validationResult[0].isValid) {
																// If valid and not already in the group, add it
																if (!projectManagementGroup.some((member) => member.username === inputProjectManagementMember.username)) {
																	setProjectManagementGroup((p) => [...p, { ...inputProjectManagementMember, ...validationResult[0] }]);
																}
																// Reset the input member
																setInputProjectManagementMember({ username: "", type: gitType });
															} else {
																// Reset the input member
																setInputProjectManagementMember({ username: "", type: gitType });
																error("Invalid user"); // Show a message indicating the user is invalid
															}
														} catch {
															error(); // Handle any validation error
														}
													}}
												>
													{"Add"}
												</Button>
											</Grid>
											<Grid item>
												<AssigneesTable assignees={projectManagementGroup} setGroup={setProjectManagementGroup} service={"ProjectManagement"} disabled={!isProjectManagementEnabled} isFromProjectManagement={true} />
											</Grid>
										</Grid>
										<Divider sx={{ border: 1, color:  theme.palette.cardBackgroundDark.main}}/>
									</>
								)}
								<Grid display="flex" justifyContent="flex-end" sx={{pt: "1rem", pb: "1rem"}}>
									<PinkContainedButton
										loading={isSubmitting}
										disabled={isLoading || areAssignmentsTheSame}
										title="Save"
										className="SaveButton"
										onClick={onSubmit}
									/>
								</Grid>
							</Grid>
						)
					}
				</div>
				<PurchasesModal
					openReportModal={openReportModal}
					setOpenReportModal={setOpenReportModal}
					selectedOrder={selectedOrder}
					buyTddReports={buyTddReports}
					setBuyTddReports={setBuyTddReports}
					buyNis2Reports={buyNis2Reports}
					setBuyNis2Reports={setBuyNis2Reports}
					setManagePlanIsLoading={setManagePlanIsLoading}
					error={error}
					isForTddReports={isForTddReports}
					isForNis2Reports={isForNis2Reports}
					isForCompanion={isForCompanion}
					isForPanorama={isForPanorama}
					setIsForCompanion={setIsForCompanion}
					setIsForPanorama={setIsForPanorama}
					setIsForTddReports={setIsForTddReports}
					setIsForNis2Reports={setIsForNis2Reports}
				/>
				<Spinner key="spinner" open={managePlanIsLoading} />
			</section>
		</>
	);
};

export default memo(Subscription);
