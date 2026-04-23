-- NexIT Solutions Onboarding Portal
-- Run this in your Hostinger MySQL database before first deployment.
-- Database: nexit_onboarding

CREATE TABLE IF NOT EXISTS agreements (
  id                        VARCHAR(36)     PRIMARY KEY,              -- UUID v4
  staff_name                VARCHAR(100)    NOT NULL,
  staff_email               VARCHAR(100)    NOT NULL,
  prepared_date             DATE            NOT NULL,

  business_name             VARCHAR(150)    NOT NULL,
  customer_name             VARCHAR(100)    NOT NULL,
  customer_email            VARCHAR(100)    NOT NULL,
  customer_phone            VARCHAR(20)     NOT NULL,

  products                  JSON            NOT NULL,                 -- e.g. ["Local SEO","SMM"]
  price                     DECIMAL(10,2)   NOT NULL,
  billing_type              ENUM('once-off','recurring') NOT NULL,
  billing_frequency         ENUM('weekly','fortnightly','monthly','quarterly','yearly') NULL,

  status                    ENUM('pending','signed','paid') NOT NULL DEFAULT 'pending',

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
