-- Backup of [tb_workplace_measurement_detail] from yescoSHE_lab2  (2026-06-22, orphan table backup before DROP)
-- Restore: run schema then data. For checklist, run 01_master before 02_item (FK).
SET NOCOUNT ON;
GO
IF OBJECT_ID('tb_workplace_measurement_detail','U') IS NOT NULL
    PRINT 'WARNING: tb_workplace_measurement_detail already exists - review before running';
GO
CREATE TABLE [tb_workplace_measurement_detail] (
    [id] bigint IDENTITY(1,1) NOT NULL,
    [measurement_id] nvarchar(50) NOT NULL,
    [hazardous_factor] nvarchar(200) NOT NULL,
    [hazardous_factor_en] nvarchar(200) NULL,
    [hazardous_factor_zh] nvarchar(200) NULL,
    [factor_type] nvarchar(50) NOT NULL,
    [work_process] nvarchar(200) NULL,
    [measurement_value] nvarchar(100) NULL,
    [exposure_standard] nvarchar(100) NULL,
    [unit] nvarchar(50) NULL,
    [result_ratio] decimal(10,4) NULL,
    [result_status] nvarchar(20) NULL DEFAULT ('normal'),
    [employee_count] int NULL,
    [notes] nvarchar(MAX) NULL,
    [created_at] datetime2(7) NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_tb_workplace_measurement_detail] PRIMARY KEY ([id])
);
GO
INSERT INTO [tb_workplace_measurement_detail] ([id], [measurement_id], [hazardous_factor], [hazardous_factor_en], [hazardous_factor_zh], [factor_type], [work_process], [measurement_value], [exposure_standard], [unit], [result_ratio], [result_status], [employee_count], [notes], [created_at]) VALUES (1, N'WM-2026-001', N'톨루엔', N'Toluene', N'甲苯', N'CHEMICAL', N'도장', N'12.5', N'TWA 50', N'ppm', 0.2500, N'normal', 8, NULL, '2026-02-10 14:31:25.163');
INSERT INTO [tb_workplace_measurement_detail] ([id], [measurement_id], [hazardous_factor], [hazardous_factor_en], [hazardous_factor_zh], [factor_type], [work_process], [measurement_value], [exposure_standard], [unit], [result_ratio], [result_status], [employee_count], [notes], [created_at]) VALUES (2, N'WM-2026-001', N'자일렌', N'Xylene', N'二甲苯', N'CHEMICAL', N'도장', N'18.3', N'TWA 100', N'ppm', 0.1830, N'normal', 8, NULL, '2026-02-10 14:31:25.163');
INSERT INTO [tb_workplace_measurement_detail] ([id], [measurement_id], [hazardous_factor], [hazardous_factor_en], [hazardous_factor_zh], [factor_type], [work_process], [measurement_value], [exposure_standard], [unit], [result_ratio], [result_status], [employee_count], [notes], [created_at]) VALUES (3, N'WM-2026-001', N'소음', N'Noise', N'噪音', N'PHYSICAL', N'도장', N'82', N'TWA 90', N'dB(A)', 0.9111, N'normal', 8, NULL, '2026-02-10 14:31:25.163');
INSERT INTO [tb_workplace_measurement_detail] ([id], [measurement_id], [hazardous_factor], [hazardous_factor_en], [hazardous_factor_zh], [factor_type], [work_process], [measurement_value], [exposure_standard], [unit], [result_ratio], [result_status], [employee_count], [notes], [created_at]) VALUES (4, N'WM-2026-002', N'용접흄', N'Welding Fume', N'焊接烟尘', N'DUST', N'용접', N'3.8', N'TWA 5', N'mg/m³', 0.7600, N'normal', 12, NULL, '2026-02-10 14:31:25.163');
INSERT INTO [tb_workplace_measurement_detail] ([id], [measurement_id], [hazardous_factor], [hazardous_factor_en], [hazardous_factor_zh], [factor_type], [work_process], [measurement_value], [exposure_standard], [unit], [result_ratio], [result_status], [employee_count], [notes], [created_at]) VALUES (5, N'WM-2026-002', N'망간', N'Manganese', N'锰', N'CHEMICAL', N'용접', N'0.12', N'TWA 0.1', N'mg/m³', 1.2000, N'exceeded', 12, N'노출기준 초과 - 환기설비 보강 필요', '2026-02-10 14:31:25.163');
INSERT INTO [tb_workplace_measurement_detail] ([id], [measurement_id], [hazardous_factor], [hazardous_factor_en], [hazardous_factor_zh], [factor_type], [work_process], [measurement_value], [exposure_standard], [unit], [result_ratio], [result_status], [employee_count], [notes], [created_at]) VALUES (6, N'WM-2026-002', N'소음', N'Noise', N'噪音', N'PHYSICAL', N'용접', N'88', N'TWA 90', N'dB(A)', 0.9778, N'caution', 12, N'기준치에 근접', '2026-02-10 14:31:25.163');
GO
-- rows: 6
