-- CreateTable
CREATE TABLE `pets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL COMMENT 'ref: clients.id — no FK constraint (per project rules)',
    `name` VARCHAR(255) NOT NULL,
    `species` VARCHAR(100) NOT NULL,
    `breed` VARCHAR(255) NOT NULL,
    `sex` TINYINT NOT NULL DEFAULT 0 COMMENT '0=unknown, 1=male, 2=female',
    `date_of_birth` DATE NULL,
    `weight_kg` DECIMAL(5, 2) NULL,
    `notes` TEXT NULL,
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0=inactive, 1=active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    FULLTEXT INDEX `pets_name_breed_notes_idx`(`name`, `breed`, `notes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
