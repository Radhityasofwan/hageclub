-- AlterTable: Add popup/voucher fields to Coupon
ALTER TABLE `Coupon` ADD COLUMN `showAsPopup` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Coupon` ADD COLUMN `popupTitle` VARCHAR(191) NULL;
ALTER TABLE `Coupon` ADD COLUMN `popupPriority` INTEGER NULL;
ALTER TABLE `Coupon` ADD COLUMN `allowedRegions` TEXT NULL;

-- CreateIndex
CREATE INDEX `Coupon_showAsPopup_isActive_idx` ON `Coupon`(`showAsPopup`, `isActive`);
