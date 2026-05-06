-- NexIT Solutions Onboarding Portal
-- Run this in your Hostinger MySQL database before first deployment.
-- Database: nexit_onboarding

CREATE TABLE IF NOT EXISTS staff (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agreements (
  id                        VARCHAR(36)     PRIMARY KEY,              -- UUID v4
  staff_name                VARCHAR(100)    NOT NULL,
  staff_email               VARCHAR(100)    NOT NULL,
  prepared_date             DATE            NOT NULL,

  business_name             VARCHAR(150)    NOT NULL,
  customer_name             VARCHAR(100)    NOT NULL,
  customer_email            VARCHAR(100)    NOT NULL,
  customer_phone            VARCHAR(20)     NOT NULL,
  customer_abn              VARCHAR(20)     NULL,

  products                  JSON            NOT NULL,                 -- e.g. ["Local SEO","SMM"]
  breakdown_notes           TEXT            NULL,
  price                     DECIMAL(10,2)   NOT NULL,
  billing_type              ENUM('once-off','recurring') NOT NULL,
  billing_frequency         ENUM('weekly','fortnightly','monthly','quarterly','yearly') NULL,

  -- Software Development fields (null for all other service types)
  sd_phase                  VARCHAR(255)    NULL,                     -- e.g. "Phase 1 — Discovery & Planning"
  sd_scope                  TEXT            NULL,                     -- scope of work for current phase
  sd_total_cost             DECIMAL(10,2)   NULL,                     -- estimated total project cost (optional)

  status                    ENUM('pending','signed','paid','voided') NOT NULL DEFAULT 'pending',

  signature_data            LONGTEXT,                                 -- base64 PNG data URL
  signed_at                 DATETIME,

  payadvantage_customer_id  VARCHAR(100),                             -- set after PA customer created
  payment_status            ENUM('unpaid','processing','paid','failed') NOT NULL DEFAULT 'unpaid',
  paid_at                   DATETIME,

  created_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status          (status),
  INDEX idx_created_at      (created_at DESC),
  INDEX idx_business_name   (business_name),
  INDEX idx_customer_name   (customer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Run these ALTER statements on an existing database:
-- ALTER TABLE agreements ADD COLUMN customer_abn VARCHAR(20) NULL AFTER customer_phone;
-- ALTER TABLE agreements ADD COLUMN breakdown_notes TEXT NULL AFTER products;
-- ALTER TABLE agreements MODIFY COLUMN status ENUM('pending','signed','paid','voided') NOT NULL DEFAULT 'pending';
-- CREATE TABLE IF NOT EXISTS staff (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
-- ALTER TABLE agreements ADD COLUMN sd_phase VARCHAR(255) NULL AFTER billing_frequency;
-- ALTER TABLE agreements ADD COLUMN sd_scope TEXT NULL AFTER sd_phase;
-- ALTER TABLE agreements ADD COLUMN sd_total_cost DECIMAL(10,2) NULL AFTER sd_scope;
