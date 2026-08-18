-- AlterTable: Add missing optional columns to Profile
ALTER TABLE `Profile` ADD COLUMN `city` VARCHAR(191) NULL;
ALTER TABLE `Profile` ADD COLUMN `birthDate` DATETIME(3) NULL;
ALTER TABLE `Profile` ADD COLUMN `adminNotes` LONGTEXT NULL;
