-- ============================================================
-- AMPARO — Database Schema Initialization
-- PostgreSQL 16+
-- This file runs ONCE on first `docker compose up`
-- (only when the postgres data volume is empty)
-- ============================================================

-- Enums
CREATE TYPE user_role        AS ENUM ('caregiver', 'nurse', 'manager');
CREATE TYPE shift_type       AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE gender_type      AS ENUM ('male', 'female', 'other');
CREATE TYPE resident_status  AS ENUM ('active', 'inactive');
CREATE TYPE medication_status AS ENUM ('administered', 'pending', 'late');
CREATE TYPE activity_type    AS ENUM ('bath', 'feeding', 'hygiene', 'physiotherapy', 'medication', 'other');
CREATE TYPE activity_status  AS ENUM ('completed', 'pending', 'not_done');
CREATE TYPE activity_shift   AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
CREATE TYPE handover_shift   AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE alert_type       AS ENUM ('medication', 'activity', 'appointment', 'incident');
CREATE TYPE alert_severity   AS ENUM ('low', 'medium', 'high', 'critical');

-- Users (staff)
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role  NOT NULL DEFAULT 'caregiver',
    shift         shift_type,
    created_at    TIMESTAMP  NOT NULL DEFAULT NOW()
);

-- Residents
CREATE TABLE IF NOT EXISTS residents (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    cpf             TEXT UNIQUE,
    date_of_birth   DATE NOT NULL,
    gender          gender_type NOT NULL,
    room            TEXT NOT NULL,
    admission_date  DATE NOT NULL,
    status          resident_status NOT NULL DEFAULT 'active',
    diagnoses       TEXT,
    allergies       TEXT,
    family_contact  TEXT,
    family_phone    TEXT,
    clinical_notes  TEXT,
    photo_url       TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Medications
CREATE TABLE IF NOT EXISTS medications (
    id              SERIAL PRIMARY KEY,
    resident_id     INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    dose            TEXT NOT NULL,
    frequency       TEXT NOT NULL,
    scheduled_times TEXT[] NOT NULL DEFAULT '{}',
    status          medication_status NOT NULL DEFAULT 'pending',
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Medication Administration Records
CREATE TABLE IF NOT EXISTS medication_administrations (
    id                  SERIAL PRIMARY KEY,
    medication_id       INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    administered_at     TIMESTAMP NOT NULL,
    administered_by     TEXT NOT NULL,
    notes               TEXT,
    is_late             BOOLEAN NOT NULL DEFAULT FALSE,
    late_justification  TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Daily Activities
CREATE TABLE IF NOT EXISTS activities (
    id           SERIAL PRIMARY KEY,
    resident_id  INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    type         activity_type   NOT NULL,
    date         DATE            NOT NULL,
    time         TEXT,
    status       activity_status NOT NULL DEFAULT 'pending',
    observations TEXT,
    shift        activity_shift  NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Medical Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id                  SERIAL PRIMARY KEY,
    resident_id         INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    time                TEXT NOT NULL,
    specialty           TEXT NOT NULL,
    status              appointment_status NOT NULL DEFAULT 'scheduled',
    observations        TEXT,
    cancellation_reason TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Shift Handovers
CREATE TABLE IF NOT EXISTS handovers (
    id          SERIAL PRIMARY KEY,
    shift       handover_shift NOT NULL,
    date        DATE NOT NULL,
    created_by  TEXT NOT NULL,
    occurrences TEXT NOT NULL,
    pendencies  TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_by     TEXT,
    read_at     TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    type        alert_type     NOT NULL,
    title       TEXT           NOT NULL,
    message     TEXT           NOT NULL,
    severity    alert_severity NOT NULL DEFAULT 'medium',
    resolved    BOOLEAN        NOT NULL DEFAULT FALSE,
    resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Demo users — passwords plaintext (academic/demo use only)
-- ============================================================
INSERT INTO users (name, email, password_hash, role, shift) VALUES
    ('Administrador',      'admin@amparo.com',      '123456', 'manager',   NULL),
    ('Enf. Carlos Silva',  'enfermeiro@amparo.com', '123456', 'nurse',     'morning'),
    ('Cuidadora Lucia',    'cuidador@amparo.com',   '123456', 'caregiver', 'afternoon')
ON CONFLICT (email) DO NOTHING;
