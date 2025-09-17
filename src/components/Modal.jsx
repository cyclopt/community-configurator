import { forwardRef, memo, useState } from "react";
import PropTypes from "prop-types";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Slide,
	Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const Transition = forwardRef((props, ref) => <Slide ref={ref} direction="up" {...props} />);

const Modal = ({ title, open, disableAreYouSureDialog, onClose, actions, children, widthAuto = false }) => {
	const [areYouSureDialogOpen, setAreYouSureDialogOpen] = useState(false);

	return (
		<Dialog
			fullWidth
			open={open}
			TransitionComponent={Transition}
			maxWidth="lg"
			scroll="body"
			PaperProps={{ sx: { borderRadius: 1, boxShadow: "shadows.4", ...(widthAuto ? { width: "auto" } : {}) } }}
			onClose={(_, reason) => {
				if (reason === "backdropClick") return;

				if (reason === "escapeKeyDown") {
					// Mimic close button behavior
					if (disableAreYouSureDialog) {
						onClose();
					} else {
						setAreYouSureDialogOpen(true);
					}

					return;
				}

				onClose(); // default fallback
			}}
		>
			<DialogTitle component="h6" sx={{ bgcolor: "primary.main", boxShadow: (t) => t.tileShadow, m: 0, px: 3, py: 1 }}>
				<Typography sx={{ fontWeight: "bold", color: "common.white" }}>{title}</Typography>
				<IconButton
					size="small"
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
						color: "common.white",
					}}
					onClick={() => (disableAreYouSureDialog ? onClose() : setAreYouSureDialogOpen(true))}
				>
					<Close />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers sx={{ overflowY: "hidden" }}>
				{children}
			</DialogContent>
			{actions && <DialogActions sx={{ p: 3 }}>{actions}</DialogActions>}
			{!disableAreYouSureDialog && (
				<Dialog
					keepMounted
					open={areYouSureDialogOpen}
					TransitionComponent={Transition}
					onClose={() => setAreYouSureDialogOpen(false)}
				>
					<DialogTitle>
						{"Are you sure?"}
					</DialogTitle>
					<DialogContent dividers>
						<DialogContentText>
							{"Any changes that were not submitted will be lost."}
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button
							autoFocus
							startIcon={<Close />}
							variant="contained"
							onClick={() => {
								setAreYouSureDialogOpen(false);
								onClose();
							}}
						>
							{"Close"}
						</Button>
						<Button variant="outlined" onClick={() => setAreYouSureDialogOpen(false)}>{"Cancel"}</Button>
					</DialogActions>
				</Dialog>
			)}
		</Dialog>
	);
};

Modal.propTypes = {
	title: PropTypes.string.isRequired,
	open: PropTypes.bool.isRequired,
	disableAreYouSureDialog: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	actions: PropTypes.node,
	widthAuto: PropTypes.bool,
	children: PropTypes.node.isRequired,
};

export default memo(Modal);
