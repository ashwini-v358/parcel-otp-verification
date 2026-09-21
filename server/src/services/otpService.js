const crypto = require("crypto");
const pool = require("../config/db");
const { logAudit } = require("./auditLogService");

function generateOTP() {
    const otp = crypto.randomInt(100000, 1000000);
    return otp.toString();
}

function hashOTP(otp) {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
}

async function createOTP(parcelId) {
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const query = `
        INSERT INTO otp_verifications
        (parcel_id, otp_hash, expires_at, attempts_used, max_attempts)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, parcel_id, expires_at, attempts_used, max_attempts;
    `;

    const values = [
        parcelId,
        otpHash,
        expiresAt,
        0,
        3
    ];

    const result = await pool.query(query, values);

    return {
        otp: otp,
        verification: result.rows[0]
    };
}

async function verifyOTP(verificationId, enteredOTP) {

    // 1. Find OTP record
    const query = `
        SELECT *
        FROM otp_verifications
        WHERE id = $1;
    `;

    const result = await pool.query(query, [verificationId]);

    if (result.rows.length === 0) {
        return {
            success: false,
            message: "OTP verification record not found"
        };
    }

    const otpRecord = result.rows[0];

    // 2. Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {

        await logAudit(
            otpRecord.parcel_id,
            otpRecord.id,
            "FAILED"
        );

        return {
            success: false,
            message: "OTP has expired"
        };
    }

    // 3. Check attempts remaining
    if (otpRecord.attempts_used >= otpRecord.max_attempts) {

        await logAudit(
            otpRecord.parcel_id,
            otpRecord.id,
            "FAILED"
        );

        return {
            success: false,
            message: "OTP is locked"
        };
    }

    // 4. Hash entered OTP
    const enteredHash = hashOTP(enteredOTP);

    const storedHash = Buffer.from(
        otpRecord.otp_hash,
        "hex"
    );

    const enteredHashBuffer = Buffer.from(
        enteredHash,
        "hex"
    );

    // 5. Compare hashes
    const isValid = crypto.timingSafeEqual(
        storedHash,
        enteredHashBuffer
    );

    // 6. Successful OTP
    if (isValid) {

        await pool.query(
            `
            UPDATE otp_verifications
            SET verified_at = CURRENT_TIMESTAMP
            WHERE id = $1;
            `,
            [verificationId]
        );

        await logAudit(
            otpRecord.parcel_id,
            otpRecord.id,
            "SUCCESS"
        );

        return {
            success: true,
            message: "OTP verified successfully"
        };
    }

    // 7. Wrong OTP - increase attempts
    const newAttempts = otpRecord.attempts_used + 1;

    await pool.query(
        `
        UPDATE otp_verifications
        SET attempts_used = $1
        WHERE id = $2;
        `,
        [newAttempts, verificationId]
    );

    // 8. Maximum attempts reached
    if (newAttempts >= otpRecord.max_attempts) {

        await logAudit(
            otpRecord.parcel_id,
            otpRecord.id,
            "FAILED"
        );

        return {
            success: false,
            message: "Maximum attempts reached. OTP locked."
        };
    }

    // 9. Log failed attempt
    await logAudit(
        otpRecord.parcel_id,
        otpRecord.id,
        "FAILED"
    );

    return {
        success: false,
        message: "Invalid OTP"
    };
}

async function test() {

    try {

        // Generate a new OTP
        const generated = await createOTP(1);

        console.log(
            "Generated OTP:",
            generated.otp
        );

        console.log(
            "Verification ID:",
            generated.verification.id
        );

        // Attempt 1 - wrong OTP
        console.log("\nAttempt 1:");

        console.log(
            await verifyOTP(
                generated.verification.id,
                "111111"
            )
        );

        // Attempt 2 - wrong OTP
        console.log("\nAttempt 2:");

        console.log(
            await verifyOTP(
                generated.verification.id,
                "111111"
            )
        );

        // Attempt 3 - wrong OTP
        console.log("\nAttempt 3:");

        console.log(
            await verifyOTP(
                generated.verification.id,
                "111111"
            )
        );

        // Attempt 4 - OTP should already be locked
        console.log("\nAttempt 4:");

        console.log(
            await verifyOTP(
                generated.verification.id,
                "111111"
            )
        );

    } catch (error) {

        console.error("\nOTP error:");
        console.error(error.message);

    } finally {

        await pool.end();
    }
}

test();