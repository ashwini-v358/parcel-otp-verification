const { isValidTransition } = require("./src/services/statusService");

console.log("CREATED → OUT_FOR_DELIVERY:",
  isValidTransition("CREATED", "OUT_FOR_DELIVERY")
);

console.log("CREATED → DELIVERED:",
  isValidTransition("CREATED", "DELIVERED")
);

console.log("OTP_SENT → DELIVERED:",
  isValidTransition("OTP_SENT", "DELIVERED")
);

console.log("DELIVERED → CREATED:",
  isValidTransition("DELIVERED", "CREATED")
);