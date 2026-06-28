-- AlterTable
ALTER TABLE `services`
  ADD COLUMN `pet_id` INT NULL COMMENT 'ref: pets.id — application-layer integrity, no FK constraint',
  ADD INDEX `services_pet_id_idx` (`pet_id`);
