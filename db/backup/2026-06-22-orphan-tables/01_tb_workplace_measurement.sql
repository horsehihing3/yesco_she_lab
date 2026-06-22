-- Backup of [tb_workplace_measurement] from yescoSHE_lab2  (2026-06-22, orphan table backup before DROP)
-- Restore: run schema then data. For checklist, run 01_master before 02_item (FK).
SET NOCOUNT ON;
GO
IF OBJECT_ID('tb_workplace_measurement','U') IS NOT NULL
    PRINT 'WARNING: tb_workplace_measurement already exists - review before running';
GO
CREATE TABLE [tb_workplace_measurement] (
    [id] bigint IDENTITY(1,1) NOT NULL,
    [measurement_id] nvarchar(50) NOT NULL,
    [work_place_id] bigint NULL,
    [measurement_year] int NOT NULL,
    [measurement_half] nvarchar(10) NOT NULL,
    [measurement_date] date NULL,
    [measurement_agency] nvarchar(200) NULL,
    [measurement_site] nvarchar(200) NULL,
    [measurement_site_detail] nvarchar(500) NULL,
    [status] nvarchar(50) NULL DEFAULT ('PLANNED'),
    [overall_result] nvarchar(50) NULL,
    [notes] nvarchar(MAX) NULL,
    [author_name] nvarchar(100) NULL,
    [author_email] nvarchar(200) NULL,
    [author_dept] nvarchar(200) NULL,
    [deleted] bit NULL DEFAULT ((0)),
    [created_at] datetime2(7) NOT NULL DEFAULT (getdate()),
    [modified_at] datetime2(7) NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_tb_workplace_measurement] PRIMARY KEY ([id])
);
GO
INSERT INTO [tb_workplace_measurement] ([id], [measurement_id], [work_place_id], [measurement_year], [measurement_half], [measurement_date], [measurement_agency], [measurement_site], [measurement_site_detail], [status], [overall_result], [notes], [author_name], [author_email], [author_dept], [deleted], [created_at], [modified_at]) VALUES (1, N'WM-2026-001', 1, 2026, N'FIRST', '2026-01-10 00:00:00.000', N'한국산업안전보건공단', N'도장공정', N'1층 도장라인 A구역', N'COMPLETED', N'PASS', N'상반기 정기 측정 완료', N'유시영', N'Siyoung.Yoo@hankook.com', N'안전환경팀', 0, '2026-01-21 14:31:25.160', '2026-02-10 14:31:25.160');
INSERT INTO [tb_workplace_measurement] ([id], [measurement_id], [work_place_id], [measurement_year], [measurement_half], [measurement_date], [measurement_agency], [measurement_site], [measurement_site_detail], [status], [overall_result], [notes], [author_name], [author_email], [author_dept], [deleted], [created_at], [modified_at]) VALUES (2, N'WM-2026-002', 1, 2026, N'FIRST', '2026-01-12 00:00:00.000', N'한국산업안전보건공단', N'용접공정', N'2층 용접라인 B구역', N'COMPLETED', N'PARTIAL', N'일부 유해인자 초과', N'유시영', N'Siyoung.Yoo@hankook.com', N'안전환경팀', 0, '2026-01-23 14:31:25.160', '2026-02-10 14:31:25.160');
INSERT INTO [tb_workplace_measurement] ([id], [measurement_id], [work_place_id], [measurement_year], [measurement_half], [measurement_date], [measurement_agency], [measurement_site], [measurement_site_detail], [status], [overall_result], [notes], [author_name], [author_email], [author_dept], [deleted], [created_at], [modified_at]) VALUES (3, N'WM-2026-003', 2, 2026, N'FIRST', NULL, NULL, N'화학물질 취급공정', N'원료 배합실', N'PLANNED', NULL, N'2월 측정 예정', N'유시영', N'Siyoung.Yoo@hankook.com', N'안전환경팀', 0, '2026-02-05 14:31:25.160', '2026-02-10 14:31:25.160');
GO
-- rows: 3
