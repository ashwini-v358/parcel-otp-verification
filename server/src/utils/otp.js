const crypto = require("crypto");

// Generate a 6-digit numeric OTP
function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

// Hash OTP before storing it in the database
function hashOTP(otp) {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
}

module.exports = {
    generateOTP,
    hashOTP
};