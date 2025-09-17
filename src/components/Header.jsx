import { memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { AppBar, Toolbar, MenuItem, Paper, Breadcrumbs, Box } from "@mui/material";

import { Home as HomeIcon } from "@mui/icons-material";
import cycloptLogo from "../assets/images/cyclopt_logo_with_text_white.svg";

import { Image } from "mui-image";

import { jwt, capitalize } from "#utils";

const styles = {
	grow: {
		flexBasis: "auto",
		elevation: 0,
	},
	sectionDesktop: {
		display: {
			xs: "none",
			md: "flex",
		},
	},
	sectionMobile: {
		display: {
			xs: "flex",
			md: "none",
		},
	},
	root: {
		width: "100%",
		px: 0,
		py: 1,
		borderRadius: "0px",
		bgcolor: "#ccd9e2",
	},
	icon: {
		mr: 0.5,
		width: 20,
		height: 20,
	},
	expanded: {
		bgcolor: "transparent",
	},
	innerSmallAvatar: {
		color: "common.black",
		fontSize: "inherit",
	},
	anchorOriginBottomRightCircular: {
		".MuiBadge-anchorOriginBottomRightCircular": {
			right: 0,
			bottom: 0,
		},
	},
	avatar: {
		width: "30px",
		height: "30px",
		background: "white",
	},
	iconButton: {
		p: "3px 6px",
	},
	menuItemButton: {
		width: "100%",
		bgcolor: "grey.light",
		"&:hover": {
			bgcolor: "grey.dark",
		},
	},
	menuItemCreateButton: {
		width: "100%",
		bgcolor: "secondary.main",
		"&:hover": {
			bgcolor: "secondary.main",
		},
	},
	grey: {
		color: "grey.500",
	},
};

const Header = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const CrumpLink = styled(Link)(({ theme }) => ({ display: "flex", color: theme.palette.primary.main }));

	const pathnames = location.pathname.split("/").filter(Boolean);
	const crumps = [];
	crumps.push(<CrumpLink to="/home" style={{ textDecoration: "none" }}> <HomeIcon sx={styles.icon} /> {"Home"} </CrumpLink>)
	if (!pathnames.includes("home")) {
		let cumulativePath = "";
		for (const [index, segment] of pathnames.entries()) {
			cumulativePath += `/${segment}`;
			const prettySegment = segment.split("-").join(" ")
			crumps.push(
				<CrumpLink key={index} to={cumulativePath} style={{ textDecoration: "none" }}>
					{capitalize(prettySegment)}
				</CrumpLink>
			);
		}
	}

	return (
		<AppBar position="static" sx={styles.grow}>
			<Toolbar className="header-container" sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
				<Box component={Link} to="/">
					<Image src={cycloptLogo} alt="Cyclopt" width="10rem" sx={{ my: 1, minWidth: "130px" }} />
				</Box>
				<>
					<MenuItem onClick={() => {
						jwt.destroyTokens();
						navigate("/");
					}}
					>
						{"Sign Out"}
					</MenuItem>
				</>
			</Toolbar>
			<Paper elevation={0} sx={styles.root}>
				<Box className="header-container" display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
					<Breadcrumbs>{crumps.map((e, ind) => <div key={`crump_${ind}`}>{e}</div>)}</Breadcrumbs>
				</Box>
			</Paper>
		</AppBar>
	);
};

export default memo(Header);
