import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import queryString from "query-string";

import { jwt } from "../utils/index.js";

const maybeSetToken = (Component) => (props) => {
	const { search } = useLocation();
	const { token } = queryString.parse(search);
	if (token) jwt.setToken(token);
	return <Component {...props} />;
};

const Protected = ({ c }) => {
	return jwt.isAuthenticated() && c;
};

Protected.propTypes = { c: PropTypes.node.isRequired, isCompanion: PropTypes.bool };

export default maybeSetToken(Protected);
