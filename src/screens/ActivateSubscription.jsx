import { memo, useState } from "react";
import { Box, Checkbox, Typography, Grid, TextField, FormControlLabel, FormGroup } from "@mui/material";
import { Info } from "@mui/icons-material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from "#utils";
import queryString from "query-string";
import { activateUserOrder } from "../api/index.js";
import Tooltip from "../components/Tooltip.jsx"

const ActivateSubscription = () => {
	const [isActivating, setIsActivating] = useState(false);
	const [checked, setChecked] = useState(true);
	const [activationKey, setActivationKey] = useState("");
	const [subscriptionName, setSubscriptionName] = useState("")
	const { success, error } = useSnackbar();
	const { search } = useLocation();
	const navigate = useNavigate();

	const onActivate = async (e) => {
		e.preventDefault();
		try {
			const parsed = queryString.parse(search);
			setIsActivating(true);

			const organizationName = checked ? "" : subscriptionName;
			const updatedOrder = await activateUserOrder(activationKey, organizationName);
			success("Your order has been activated!")
			setIsActivating(false);

			// Get the current path and remove the last segment
			const pathSegments = location.pathname.split("/").filter(Boolean);
			pathSegments.pop(); // remove the last segment
			const previousPath = "/" + pathSegments.join("/");
			parsed.selectedOrderId = updatedOrder._id;

			navigate(queryString.stringifyUrl({url: `${previousPath}`, query: parsed}));
		} catch (_error) {
			setIsActivating(false);
			const errorMsg = await _error.response.json() ?? "Oops, something went wrong ";
			error(errorMsg.message);
		}
	}

	return (
		<section style={{ paddingTop: "1rem" }}>
			<div className="container">
				<Grid sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
					<Typography variant="h4">{"Manage orders"}</Typography>
				</Grid>
				<Grid direction="column" id="subscriptionActivation-2" sx={{ pt: "1rem", pb: "1rem" }}>
					<Typography variant="h6" sx={{ mb: "0.5rem" }}>{"Activate Order"}</Typography>
					<Grid container alignItems="center" sx={{ gap: "1rem", width: "100%", mb: "0.5rem"}}>
						<TextField
							required
							id="activationKey"
							size="small"
							sx={{ flex: 1 }}
							value={activationKey || ""}
							placeholder="Insert the activation key"
							onChange={(e) => setActivationKey(e.target.value)}
						/>
						<LoadingButton
							className="activateButton"
							variant="contained"
							color="primary"
							size="medium"
							loading={isActivating}
							disabled={!activationKey || (!checked && !subscriptionName)}
							onClick={onActivate}
						>
							{"Activate"}
						</LoadingButton>
					</Grid>
					<Grid container display="flex" sx={{ gap: "1rem", mt: "1rem"}}>
						<Typography>
							{"Select a name	to associate with your order. This name will help you identify your order later."}
						</Typography>
						<Tooltip title="If your order includes panorama seats, this name will be used for your organization!">
							<Info color="primary"/>
						</Tooltip>
					</Grid>
					<Box sx={{ width: "fit-content" }}>
						<FormGroup>
							<FormControlLabel
								control={
									<Checkbox defaultChecked checked={checked} size="small" onChange={(event) => { setChecked(event.target.checked) }}/>
								}
								label={
									<Typography fontSize="0.9rem">
										{"Use company or full name by default"}
									</Typography>
								}
							/>
						</FormGroup>
					</Box>
					{
						!checked && (
							<Grid display="flex" sx={{ width: "100%", mb: "0.5rem" }}>
								<TextField
									required
									id="activationKey"
									size="small"
									sx={{ flex: 1 }}
									value={subscriptionName || ""}
									placeholder="Insert order name"
									onChange={(e) => setSubscriptionName(e.target.value)}
								/>
							</Grid>
						)
					}
				</Grid>
			</div>
		</section>
	);
};

export default memo(ActivateSubscription);
