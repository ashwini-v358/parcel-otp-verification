-- Parcel OTP Verification Engine
-- Database schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- 1. USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'agent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. PARCELS
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    tracking_id VARCHAR(50) UNIQUE NOT NULL,

    sender_name VARCHAR(100) NOT NULL,
    sender_address TEXT NOT NULL,

    receiver_name VARCHAR(100) NOT NULL,
    receiver_address TEXT NOT NULL,
    receiver_phone VARCHAR(20),

    current_status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
        CHECK (current_status IN (
            'CREATED',
            'ASSIGNED',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'FAILED'
        )),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. STATUS HISTORY
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,

    parcel_id INTEGER NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,

    changed_by INTEGER,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB,

    FOREIGN KEY (parcel_id)
        REFERENCES parcels(id),

    FOREIGN KEY (changed_by)
        REFERENCES users(id)
);


-- 4. OTP VERIFICATIONS
CREATE TABLE otp_verifications (
    id SERIAL PRIMARY KEY,

    parcel_id INTEGER NOT NULL,

    otp_hash VARCHAR(255) NOT NULL,

    expires_at TIMESTAMP NOT NULL,

    attempts_used INTEGER DEFAULT 0,

    max_attempts INTEGER DEFAULT 3,

    verified_at TIMESTAMP,

    FOREIGN KEY (parcel_id)
        REFERENCES parcels(id)
);


-- 5. VERIFICATION AUDIT LOG
CREATE TABLE verification_audit_log (
    id SERIAL PRIMARY KEY,

    parcel_id INTEGER NOT NULL,

    otp_verification_id INTEGER,

    result VARCHAR(20) NOT NULL
        CHECK (result IN ('SUCCESS', 'FAILED')),

    ip_address INET,

    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parcel_id)
        REFERENCES parcels(id),

    FOREIGN KEY (otp_verification_id)
        REFERENCES otp_verifications(id)
);