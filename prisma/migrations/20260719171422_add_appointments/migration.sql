-- Create appointments table with denormalized client_id
CREATE TABLE `appointments` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `pet_id`       INT          NOT NULL COMMENT 'ref: pets.id — no FK constraint',
  `client_id`    INT          NOT NULL COMMENT 'ref: clients.id — denormalized from pet on create',
  `scheduled_at` DATETIME(3)  NOT NULL,
  `status`       TINYINT      NOT NULL DEFAULT 0 COMMENT '0=pending, 1=confirmed, 2=completed, 3=cancelled',
  `notes`        VARCHAR(500) NULL,
  `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_pet_id` (`pet_id`),
  INDEX `idx_client_id` (`client_id`),
  INDEX `idx_scheduled_at` (`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
