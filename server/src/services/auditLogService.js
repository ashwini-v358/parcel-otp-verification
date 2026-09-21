const pool = require("../config/db");

async function logAudit(
    parcelId,
    verificationId,
    result
) {
    await pool.query(
        `
        INSERT INTO verification_audit_log
        (parcel_id, otp_verification_id, result)
        VALUES ($1, $2, $3);
        `,
        [parcelId, verificationId, result]
    );
}

module.exports = {
    logAudit
};
