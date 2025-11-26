/*
  Warnings:

  - Added the required column `shop_margin_rate` to the `goods_online_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "goods_online_details" ADD COLUMN     "shop_margin_rate" DECIMAL(5,2) NOT NULL;
