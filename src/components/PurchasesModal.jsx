/* global globalThis */

import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { LoadingButton } from "@mui/lab";
import {
	Typography, Grid, Box, Input, FormGroup, FormControlLabel,
	FormControl, Radio, FormLabel, RadioGroup} from "@mui/material";
import constructUrl from "@iamnapo/construct-url";
import Modal from "./Modal.jsx";
import queryString from "query-string";
import { useLocation, useNavigate } from "react-router-dom";

const MAX_INPUT = 50;
const MIN_INPUT = 1;

const NumberInput = ({ label, value, onChange }) => (
	<Box sx={{ display: "flex", alignItems: "baseline", py: 2, gap: "0.5rem" }}>
		<Typography fontWeight="bold">{label}</Typography>
		<Input
			type="number"
			value={value}
			onChange={(e) => {
				const val = Number.parseInt(e.target.value, 10);
				onChange(Math.min(Math.max(val || MIN_INPUT, MIN_INPUT), MAX_INPUT));
			}}
			inputProps={{
				min: MIN_INPUT,
				max: MAX_INPUT,
				style: { textAlign: "center", width: "3rem", height: "1rem" },
			}}
		/>
	</Box>
);

const PurchasesModal = ({
	openReportModal,
	selectedOrder,
	setOpenReportModal,
	buyTddReports,
	setBuyTddReports,
	buyNis2Reports,
	setBuyNis2Reports,
	setManagePlanIsLoading,
	error,
	isForTddReports,
	isForNis2Reports,
	isForCompanion,
	isForPanorama,
	setIsForCompanion,
	setIsForPanorama,
	setIsForTddReports,
	setIsForNis2Reports,
}) => {
	const { search } = useLocation();
	const navigate = useNavigate();
	const [buyCompanionSeats, setBuyCompanionSeats] = useState(1);
	const [buyPanoramaSeats, setBuyPanoramaSeats] = useState(1);
	const [recurrenceValue, setRecurrenceValue] = useState('monthly');
	const [recurringExist, setRecurringExist] = useState(false);

	// get recurring value
	useEffect(() => {
		// companion
		const companionValidUntil = selectedOrder?.subscription?.companion?.payment?.validUntil ?? null;
		const companionPaidAt = selectedOrder?.subscription?.companion?.payment?.paidAt ?? null;
		const companionPeriod = selectedOrder?.subscription?.companion?.payment?.period ?? null
		// panorma
		const panoramaValidUntil = selectedOrder?.subscription?.panorama?.payment?.validUntil ?? null;
		const panoramaPaidAt = selectedOrder?.subscription?.panorama?.payment?.paidAt ?? null;
		const panoramaPeriod = selectedOrder?.subscription?.panorama?.payment?.period ?? null;

		if (companionValidUntil && companionPaidAt && companionPeriod) {
			setRecurrenceValue(companionPeriod === "yearly" ? "annually" : "monthly")
			setRecurringExist(true);
		} else if (panoramaValidUntil && panoramaPaidAt && panoramaPeriod) {
			setRecurrenceValue(panoramaPeriod === "yearly" ? "annually" : "monthly")
			setRecurringExist(true);
		} else {
			setRecurringExist(false);
		}
	},[selectedOrder])

	const disableCheckOutButton = useMemo(() => {
		if (!recurrenceValue) return true
		if (isForCompanion && buyCompanionSeats === 0) return true;
		if (isForPanorama && buyPanoramaSeats === 0) return true;
		if (isForTddReports && buyTddReports === 0 ) return true;
		if (isForNis2Reports && buyNis2Reports === 0) return true;
		
		return false;
	}, [isForCompanion, buyCompanionSeats, isForPanorama, buyPanoramaSeats,
		isForTddReports, buyTddReports, isForNis2Reports, buyNis2Reports, recurrenceValue]);

	const resetModal = () => {
		setIsForCompanion(false);
		setIsForPanorama(false);
		setIsForTddReports(false);
		setIsForNis2Reports(false);
		setBuyCompanionSeats(0);
		setBuyPanoramaSeats(0);
		setBuyTddReports(1);
		setBuyNis2Reports(1);
		setOpenReportModal(false)
	};

	const managePurchase = async () => {
		setManagePlanIsLoading(true);
		try {
			const baseData = {
				fullName: selectedOrder.invoiceInfo.name,
				email: selectedOrder.invoiceInfo.email,
				recurrence: (isForTddReports || isForNis2Reports) ? "one-off" : recurrenceValue,
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

			if (isForTddReports || isForNis2Reports) {
				const reportKey = isForTddReports ? "tddReports" : "nis2Reports";
				baseData[reportKey] = isForTddReports ? buyTddReports : buyNis2Reports;
				baseData.totalOneOff = isForTddReports ? (buyTddReports * 500) : (buyNis2Reports * 500);
			} else if (isForCompanion) {
				baseData.companionSeats = buyCompanionSeats;
				baseData.total = recurrenceValue === "monthly" ? (buyCompanionSeats * 20) : (buyCompanionSeats * 20) * 10;
			} else if (isForPanorama) {
				const base = 500;
				const extra = Math.max(buyPanoramaSeats - 5, 0) * 100;
				baseData.panoramaSeats = buyPanoramaSeats;
				baseData.total = recurrenceValue === "monthly" ? base + extra : (base + extra) * 10;
			} else {
				error("Invalid selection.");
				return;
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

	const handleRecurrenceValue = (event) => {
		setRecurrenceValue(event.target.value);
	};

	return (
		<Modal
			keepMounted
			disableAreYouSureDialog
			widthAuto
			open={openReportModal}
			title={
				isForTddReports || isForNis2Reports
					? `Purchase more ${isForTddReports ? "TDD" : "NIS2"} reports`
					: "Purchase products"
			}
			sx={{ width: "max-content" }}
			actions={
				<LoadingButton
					variant="contained"
					color="secondary"
					sx={{ color: "common.white" }}
					disabled={disableCheckOutButton}
					onClick={async () => {
						await managePurchase();
						resetModal();
					}}
				>
					{"Go to Checkout"}
				</LoadingButton>
			}
			onClose={resetModal}
		>
			<Grid container direction="column" sx={{ width: 400 }}>
				<FormGroup>
					{(isForTddReports || isForNis2Reports) && (
						<NumberInput
							label="Enter number of Reports:"
							value={isForTddReports ? buyTddReports : buyNis2Reports}
							onChange={isForTddReports ? setBuyTddReports : setBuyNis2Reports}
						/>
					)}
					{isForCompanion && (
						<>
							<NumberInput
								label="Enter number of Seats:"
								value={buyCompanionSeats}
								onChange={setBuyCompanionSeats}
							/>
							{(selectedOrder.subscription.companion.seats === 0 && !recurringExist) && (
								<FormControl>
									<FormLabel id="demo-row-radio-buttons-group-label">{"Recurrence"}</FormLabel>
									<RadioGroup
										row
										aria-labelledby="demo-row-radio-buttons-group-label"
										name="row-radio-buttons-group"
									>
										<FormControlLabel value="monthly" control={<Radio />} label="monthly" checked={recurrenceValue === "monthly"} onChange={handleRecurrenceValue} />
										<FormControlLabel value="annually" control={<Radio />} label="annually" checked={recurrenceValue === "annually"} onChange={handleRecurrenceValue}/>
									</RadioGroup>
								</FormControl>
							)}
						</>
						
					)}
					{isForPanorama && (
						<>
							<NumberInput
								label="Enter number of Seats:"
								value={buyPanoramaSeats}
								onChange={setBuyPanoramaSeats}
							/>
							{((selectedOrder.subscription.panorama.seats === 0 && !recurringExist)) && (
								<FormControl>
									<FormLabel id="demo-row-radio-buttons-group-label">{"Recurrence"}</FormLabel>
									<RadioGroup
										row
										aria-labelledby="demo-row-radio-buttons-group-label"
										name="row-radio-buttons-group"
									>
										<FormControlLabel value="monthly" control={<Radio />} label="monthly" checked={recurrenceValue === "monthly"} onChange={handleRecurrenceValue} />
										<FormControlLabel value="annually" control={<Radio />} label="annually" checked={recurrenceValue === "annually"} onChange={handleRecurrenceValue}/>
									</RadioGroup>
								</FormControl>
							)}
						</>
					)}
				</FormGroup>
			</Grid>
		</Modal>
	);
};

PurchasesModal.propTypes = {
	openReportModal: PropTypes.bool,
	selectedOrder: PropTypes.object,
	setOpenReportModal: PropTypes.func,
	buyTddReports: PropTypes.number,
	setBuyTddReports: PropTypes.func,
	buyNis2Reports: PropTypes.number,
	setBuyNis2Reports: PropTypes.func,
	setManagePlanIsLoading: PropTypes.func,
	error: PropTypes.func,
	isForTddReports: PropTypes.bool,
	isForNis2Reports: PropTypes.bool,
	isForCompanion: PropTypes.bool,
	isForPanorama: PropTypes.bool,
	isForApi: PropTypes.bool,
	isForGuard: PropTypes.bool,
	isForProjectManagement: PropTypes.bool,
	setIsForCompanion: PropTypes.func,
	setIsForPanorama: PropTypes.func,
	setIsForApi: PropTypes.func,
	setIsForGuard: PropTypes.func,
	setIsForProjectManagement: PropTypes.func,
	setIsForTddReports: PropTypes.func,
	setIsForNis2Reports: PropTypes.func,
};

export default PurchasesModal;
