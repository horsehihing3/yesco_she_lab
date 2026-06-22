-- Backup of [tb_checklist_template_master] from yescoSHE_lab2  (2026-06-22, orphan table backup before DROP)
-- Restore: run schema then data. For checklist, run 01_master before 02_item (FK).
SET NOCOUNT ON;
GO
IF OBJECT_ID('tb_checklist_template_master','U') IS NOT NULL
    PRINT 'WARNING: tb_checklist_template_master already exists - review before running';
GO
CREATE TABLE [tb_checklist_template_master] (
    [id] bigint IDENTITY(1,1) NOT NULL,
    [title] nvarchar(200) NOT NULL,
    [reg_user] nvarchar(100) NULL,
    [mod_user] nvarchar(100) NULL,
    [created_at] datetime2(7) NULL DEFAULT (getdate()),
    [modified_at] datetime2(7) NULL DEFAULT (getdate()),
    [check_date] nvarchar(20) NULL,
    [checker] nvarchar(100) NULL,
    [check_manager] nvarchar(100) NULL,
    [facility_manager] nvarchar(100) NULL,
    CONSTRAINT [PK_tb_checklist_template_master] PRIMARY KEY ([id])
);
GO
INSERT INTO [tb_checklist_template_master] ([id], [title], [reg_user], [mod_user], [created_at], [modified_at], [check_date], [checker], [check_manager], [facility_manager]) VALUES (3, N'화재 및 비상 대피', N'admin', N'com4in', '2026-03-20 16:51:32.706', '2026-03-20 17:37:11.573', NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_master] ([id], [title], [reg_user], [mod_user], [created_at], [modified_at], [check_date], [checker], [check_manager], [facility_manager]) VALUES (4, N'전기 및 전원 안전', N'admin', NULL, '2026-03-20 16:51:32.706', '2026-03-20 16:51:32.706', NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_master] ([id], [title], [reg_user], [mod_user], [created_at], [modified_at], [check_date], [checker], [check_manager], [facility_manager]) VALUES (5, N'통로 및 작업 환경', N'admin', NULL, '2026-03-20 16:51:32.706', '2026-03-20 16:51:32.706', NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_master] ([id], [title], [reg_user], [mod_user], [created_at], [modified_at], [check_date], [checker], [check_manager], [facility_manager]) VALUES (6, N'인간공학 및 작업자 건강', N'admin', NULL, '2026-03-20 16:51:32.706', '2026-03-20 16:51:32.706', NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_master] ([id], [title], [reg_user], [mod_user], [created_at], [modified_at], [check_date], [checker], [check_manager], [facility_manager]) VALUES (7, N'보안 및 개인 안전', N'admin', NULL, '2026-03-20 16:51:32.706', '2026-03-20 16:51:32.706', NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_master] ([id], [title], [reg_user], [mod_user], [created_at], [modified_at], [check_date], [checker], [check_manager], [facility_manager]) VALUES (8, N'응급처치 및 의료 대비', N'admin', NULL, '2026-03-20 16:51:32.706', '2026-03-20 16:51:32.706', NULL, NULL, NULL, NULL);
GO
-- rows: 6
