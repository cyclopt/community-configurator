import { memo } from "react";
import { Link, Typography, Grid, Box } from "@mui/material";

const Footer = () => (
	<Box component="footer" className="container" sx={{ pt: "2rem", pb: "1rem", textAlign: "center", flexGrow: "0 !important" }}>
		<Grid container>
			<Grid item xs={12} alignItems="center">
				<Typography gutterBottom>
					<Link underline="none" href="http://cyclopt.com/" target="_blank" rel="noopener noreferrer">{"Cyclopt"}</Link>
					{` ${new Date().getFullYear()}. All rights reserved.`}
				</Typography>
			</Grid>
			<Grid item xs={12} sx={{ color: "primary.main" }}>
				<Typography gutterBottom>
					<Link underline="none" href="http://cyclopt.com/tos" target="_blank" rel="noopener noreferrer">
						{"Terms of Service"}
					</Link>
					{" • "}
					<Link underline="none" href="http://cyclopt.com/privacy" target="_blank" rel="noopener noreferrer">
						{"Privacy Policy"}
					</Link>
					{" • "}
					<Link underline="none" href="http://cyclopt.com/thirdparty" target="_blank" rel="noopener noreferrer">
						{"Third Party Services"}
					</Link>
					{" • "}
					<Link underline="none" href="http://cyclopt.com/security" target="_blank" rel="noopener noreferrer">
						{"Security"}
					</Link>
				</Typography>
			</Grid>
		</Grid>
	</Box>
);

export default memo(Footer);
