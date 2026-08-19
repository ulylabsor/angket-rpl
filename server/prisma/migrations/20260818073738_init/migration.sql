-- CreateTable
CREATE TABLE `Fakultas` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Fakultas_nama_key`(`nama`),
    UNIQUE INDEX `Fakultas_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prodi` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `fakultasId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Prodi_fakultasId_idx`(`fakultasId`),
    UNIQUE INDEX `Prodi_nama_fakultasId_key`(`nama`, `fakultasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeriodeMonev` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `tglMulai` DATE NOT NULL,
    `tglSelesai` DATE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `deskripsi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AngketTemplate` (
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`kode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Butir` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `dimensi` VARCHAR(191) NOT NULL,
    `nomor` INTEGER NOT NULL,
    `teks` TEXT NOT NULL,
    `urut` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Butir_templateId_idx`(`templateId`),
    UNIQUE INDEX `Butir_templateId_nomor_key`(`templateId`, `nomor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Respons` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `templateKode` VARCHAR(191) NOT NULL,
    `identitas` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'submitted',
    `alasanAnulir` TEXT NULL,
    `skorInput` DOUBLE NULL,
    `skorProses` DOUBLE NULL,
    `skorOutput` DOUBLE NULL,
    `nilaiInput` DOUBLE NULL,
    `nilaiProses` DOUBLE NULL,
    `nilaiOutput` DOUBLE NULL,
    `nilaiAkhir` DOUBLE NULL,
    `kategori` VARCHAR(191) NULL,
    `tindakLanjut` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,

    INDEX `Respons_periodeId_idx`(`periodeId`),
    INDEX `Respons_templateKode_idx`(`templateKode`),
    INDEX `Respons_kategori_idx`(`kategori`),
    INDEX `Respons_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JawabanSkala` (
    `id` VARCHAR(191) NOT NULL,
    `responsId` VARCHAR(191) NOT NULL,
    `butirId` VARCHAR(191) NOT NULL,
    `skor` INTEGER NOT NULL,

    INDEX `JawabanSkala_responsId_idx`(`responsId`),
    INDEX `JawabanSkala_butirId_idx`(`butirId`),
    UNIQUE INDEX `JawabanSkala_responsId_butirId_key`(`responsId`, `butirId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JawabanTerbuka` (
    `id` VARCHAR(191) NOT NULL,
    `responsId` VARCHAR(191) NOT NULL,
    `q21` TEXT NULL,
    `q22` TEXT NULL,
    `q23` TEXT NULL,
    `q24` TEXT NULL,
    `q25` TEXT NULL,

    UNIQUE INDEX `JawabanTerbuka_responsId_key`(`responsId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Temuan` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `temuan` TEXT NOT NULL,
    `bukti` TEXT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `akarMasalah` TEXT NULL,
    `rekomendasi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Temuan_periodeId_idx`(`periodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RTL` (
    `id` VARCHAR(191) NOT NULL,
    `temuanId` VARCHAR(191) NOT NULL,
    `programPerbaikan` TEXT NOT NULL,
    `pic` VARCHAR(191) NOT NULL,
    `tglMulai` DATE NULL,
    `tglSelesai` DATE NULL,
    `indikatorKeberhasilan` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Belum',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RTL_temuanId_idx`(`temuanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BeritaAcara` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `fakultas` VARCHAR(191) NULL,
    `prodi` VARCHAR(191) NULL,
    `tanggalBA` DATE NOT NULL,
    `nilai` DOUBLE NULL,
    `kategori` VARCHAR(191) NULL,
    `temuanUtama` JSON NULL,
    `rekomendasi` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BeritaAcara_periodeId_idx`(`periodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `aksi` VARCHAR(191) NOT NULL,
    `target` VARCHAR(191) NULL,
    `detail` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prodi` ADD CONSTRAINT `Prodi_fakultasId_fkey` FOREIGN KEY (`fakultasId`) REFERENCES `Fakultas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Butir` ADD CONSTRAINT `Butir_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `AngketTemplate`(`kode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Respons` ADD CONSTRAINT `Respons_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodeMonev`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanSkala` ADD CONSTRAINT `JawabanSkala_responsId_fkey` FOREIGN KEY (`responsId`) REFERENCES `Respons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanTerbuka` ADD CONSTRAINT `JawabanTerbuka_responsId_fkey` FOREIGN KEY (`responsId`) REFERENCES `Respons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Temuan` ADD CONSTRAINT `Temuan_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodeMonev`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RTL` ADD CONSTRAINT `RTL_temuanId_fkey` FOREIGN KEY (`temuanId`) REFERENCES `Temuan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BeritaAcara` ADD CONSTRAINT `BeritaAcara_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `PeriodeMonev`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
