import PropTypes from "prop-types";
import { IconButton, Avatar, Badge, Grid, Typography, Box, Grow } from "@mui/material";
import { Add, GitHub } from "@mui/icons-material";
import Tooltip from "./Tooltip.jsx";
import AzureIcon from "./AzureIcon.jsx";
import BitBucketIcon from "./BitBucketIcon.jsx";
import GitLabIcon from "./GitLabIcon.jsx";

const AssigneesTable = ({ assignees, setGroup, service, disabled, isFromProjectManagement }) => {

	return (
		<>
			<Grow in={assignees?.length > 0}>
				<Grid item xs={12} sx={{ display: assignees?.length > 0 ? "block" : "none" }}>
					<Box mb={1} sx={{ display: "flex", border: 1, borderRadius: "0.5rem", flexFlow: "wrap", flex: "start" }}>
						{assignees?.map((
							{ username, isDeleted, isValid, type: mType, email, avatar},
							uIndex,
						) => (
							<Grid
								key={`${username}_${uIndex}`}
								container
								direction="row"
								sx={{
									alignItems: "center",
									justifyContent: "center",
									height: "100%",
								}}
								p={1}
								xs={12}
								sm={6}
								lg={4}
							>
								<Grid item xs={1} display="flex" justifyContent="center">
									<Tooltip
										title={isDeleted ? `Assign to ${service}` : `Remove from ${service}`}
									>
										<span>
											<IconButton
												disableRipple
												edge="end"
												aria-label={assignees[uIndex]?.isDeleted ? "add" : "delete"}
												disabled={!assignees[uIndex].isValid || disabled}
												size="small"
												color="pink"
												onClick={() => {
													setGroup((p) => {
														p[uIndex].isDeleted = !p[uIndex].isDeleted;
													});
												}}
												sx={{
													// Optional: Maintain cursor style for disabled state
													'&.Mui-disabled': {
														pointerEvents: 'auto', // Allow hover in wrapper
														cursor: 'not-allowed'
													}
												}}
											>
												<Add className={assignees[uIndex]?.isDeleted ? "add-collaborator" : "remove-collaborator"} />
											</IconButton>
										</span>
									</Tooltip>
								</Grid>
								<Tooltip title={!isValid && "Invalid user"}>
									<Grid
										item
										xs={11}
										sx={{
											display: "flex",
											justifyContent: "space-around",
											alignItems: "center",
											opacity: (isDeleted || !isValid) ? 0.7 : 1,
											transition: "opacity 200ms",
										}}
									>
										<Grid item xs={2}>
											<Badge
												overlap="circular"
												anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
												badgeContent={(
													<Box
														sx={{
															backgroundColor: "white",
															borderRadius: "50%",
															height: "1rem",
															width: "1rem",
															display: "flex",
															justifyContent: "center",
															alignItems: "center",
														}}
													>
														{mType === "github"
															? <GitHub style={{ fontSize: "0.9rem" }} />
															: mType === "bitbucket"
																? <BitBucketIcon style={{ fontSize: "0.7rem" }} />
																: mType === "azure"
																	? <AzureIcon style={{ fontSize: "inherit" }} />
																	: mType === "gitlab"
																		? <GitLabIcon style={{ fontSize: "inherit" }} />
																		: null

														}
													</Box>
												)}
											>
												<Avatar alt="test" sx={{ height: "3rem", width: "3rem" }} src={avatar} />
											</Badge>
										</Grid>
										<Grid container xs={8} align="start" p={1} sx={{ overflowY: "auto" }}>
											<Grid item display="flex" flexDirection="row" justifyContent="space-between" sx={{ width: "100%" }}>
												<Typography style={{ textOverflow: "ellipsis", overflow: "hidden" }}>
													{username}
												</Typography>
											</Grid>
											<Grid item display="flex" flexDirection="row" style={{ width: "100%" }}>
												<Typography variant="caption" style={{ textOverflow: "ellipsis", overflow: "hidden" }}>{`${email ?? "No email found"}`}</Typography>
											</Grid>
										</Grid>
									</Grid>
								</Tooltip>			
							</Grid>
						))}
					</Box>
				</Grid>
			</Grow>
			{(assignees?.length <= 0 && !isFromProjectManagement)
			&& (
				<Typography variant="caption" sx={{ alignSelf: "center" }}>
					{`There are no assignees in ${service}`}
				</Typography>
			)}

		</>
	);
};

AssigneesTable.propTypes = {
	collaborators: PropTypes.array,
	setGroup: PropTypes.func,
	service: PropTypes.string,
	disabled: PropTypes.bool,
};

export default AssigneesTable;
