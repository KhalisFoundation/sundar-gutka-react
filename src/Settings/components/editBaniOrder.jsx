import React from "react";
import PropTypes from "prop-types";
import { STRINGS } from "@common";
import SettingsRow from "./comon/SettingsRow";

const EditBaniOrder = ({ navigate }) => (
  <SettingsRow
    title={STRINGS.EDIT_BANI_ORDER}
    iconImage={require("../../../images/rearrangeicon.png")}
    onPress={() => navigate("EditBaniOrder")}
  />
);

EditBaniOrder.propTypes = { navigate: PropTypes.func.isRequired };

export default EditBaniOrder;
