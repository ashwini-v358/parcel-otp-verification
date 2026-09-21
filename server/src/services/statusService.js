const { ALLOWED_TRANSITIONS } = require("../config/parcelStatus");


function isValidTransition(currentStatus, nextStatus) {

  const allowedStatuses =
    ALLOWED_TRANSITIONS[currentStatus] || [];

  return allowedStatuses.includes(nextStatus);
}


module.exports = {
  isValidTransition
};