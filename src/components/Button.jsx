import { Typography, Button } from "@mui/material";
import { Link } from 'react-router-dom';  
import LoadingButton from "@mui/lab/LoadingButton";

export const PrimaryOutlinedButton = ({
	id,
	type = "button",
	disabled = false,
	className = "",
	title = "Configure",
	titleClassName = "",
	titleColor = "primary",
	size = "",
	link = "",
	width = "200px",
	onClick,
}) => {
	return (link && !disabled) ? (
		<Link to={link}>
			<Button
				key={id}
				id={id}
				type={type}
				disabled={disabled}
				className={className}
				variant="outlined"
				color="primary"
				size={(size || "")}
				style={{ borderRadius: 28,
					...(width && { width }) }}
				onClick={() => {onClick}}
			>
				<Typography className={titleClassName} sx={{ color: `${titleColor}!important`, fontSize: "small" }} style={{ textTransform: "none" }}>
					<b>
						{title}
					</b>
				</Typography>
			</Button>
		</Link>
	) : (
		<Button
			key={id}
			id={id}
			type={type}
			disabled={disabled}
			className={className}
			variant="outlined"
			color="primary"
			size={(size || "")}
			style={{ borderRadius: 28,
				...(width && { width }) }}
			onClick={onClick}
		>
			<Typography className={titleClassName} sx={{ color: `${titleColor}!important`, fontSize: "small" }} style={{ textTransform: "none" }}>
				<b>
					{title}
				</b>
			</Typography>
		</Button>
	)
}

export const PinkContainedButton = ({
	id = "saveButton",
	type = "button",
	loading = false,
	disabled = false,
	className = "",
	title = "",
	titleClassName = "",
	titleColor = "white",
	size = "",
	width = "100px",
	onClick,
}) =>  (
	<LoadingButton
		key={id}
		id={id}
		type={type}
		loading={loading}
		disabled={disabled}
		className={className}
		variant="contained"
		color="pink"
		size={(size || "")}
		style={{ borderRadius: 10,
			...(width && { width }),
			minHeight: "36px" 
		}} // Added minHeight to maintain button height
		onClick={onClick}
	>
		{!loading && (
			<Typography className={titleClassName} sx={{ color: `${titleColor}!important`, fontSize: "small" }} style={{ textTransform: "uppercase" }}>
				<b>
					{title}
				</b>
			</Typography>
		)}
	</LoadingButton>
)
