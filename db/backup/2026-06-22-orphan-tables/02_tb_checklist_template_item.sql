-- Backup of [tb_checklist_template_item] from yescoSHE_lab2  (2026-06-22, orphan table backup before DROP)
-- Restore: run schema then data. For checklist, run 01_master before 02_item (FK).
SET NOCOUNT ON;
GO
IF OBJECT_ID('tb_checklist_template_item','U') IS NOT NULL
    PRINT 'WARNING: tb_checklist_template_item already exists - review before running';
GO
CREATE TABLE [tb_checklist_template_item] (
    [id] bigint IDENTITY(1,1) NOT NULL,
    [master_id] bigint NOT NULL,
    [category] nvarchar(100) NULL,
    [check_item] nvarchar(200) NULL,
    [check_content] nvarchar(500) NULL,
    [is_normal] nvarchar(10) NULL,
    [is_abnormal] nvarchar(10) NULL,
    [remarks] nvarchar(500) NULL,
    [check_standard] nvarchar(500) NULL,
    [action_taken] nvarchar(500) NULL,
    [confirm] nvarchar(100) NULL,
    CONSTRAINT [PK_tb_checklist_template_item] PRIMARY KEY ([id])
);
GO
ALTER TABLE [tb_checklist_template_item] ADD CONSTRAINT [FK_tpl_item_master] FOREIGN KEY ([master_id]) REFERENCES [tb_checklist_template_master]([id]) ON DELETE CASCADE;
GO
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (42, 4, N'전기설비', N'콘센트 및 전선 상태', N'콘센트와 전선이 손상 없이 정상 상태인가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (43, 4, N'전기설비', N'멀티탭 과부하', N'멀티탭이 과부하 없이 적정 용량 내에서 사용되고 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (44, 4, N'전기설비', N'전기 배전반 장애물', N'전기 배전반 앞에 장애물이 없는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (45, 4, N'전기설비', N'미사용 전기 기기 전원 차단', N'미사용 전기 기기의 전원이 퇴근 시 차단되고 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (46, 4, N'UPS', N'비상 전원장치 상태', N'비상 전원장치(UPS)가 정상 작동 상태인가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (47, 5, N'통로', N'바닥 물기 및 장애물', N'복도 및 통로 바닥에 물기, 장애물이 없는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (48, 5, N'통로', N'카펫·매트 고정', N'카펫·매트가 고정되어 있고 걸림 위험이 없는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (49, 5, N'조명', N'작업 공간 조명', N'작업 공간 전체에 충분한 조명이 확보되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (50, 5, N'청결', N'정리 정돈', N'사무용품·서류가 정리 정돈되어 위험 요소가 없는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (51, 5, N'서랍장', N'파일 캐비넷 서랍', N'파일 캐비넷의 서랍이 닫혀 있어 충돌 위험이 없는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (52, 5, N'무거운 물건', N'높은 선반 물건 고정', N'높은 선반의 무거운 물건이 안전하게 고정되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (53, 6, N'의자', N'의자 높이 및 허리 지지대', N'의자 높이가 조절되고 허리 지지대가 적절히 작동하는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (54, 6, N'모니터', N'모니터 높이 및 거리', N'모니터 높이와 거리가 눈높이에 맞게 설정되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (55, 6, N'키보드/마우스', N'키보드 마우스 배치', N'키보드와 마우스가 손목 부담 없이 배치되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (56, 6, N'휴식', N'스트레칭 및 휴식', N'정기적인 스트레칭 및 휴식 시간이 권장되고 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (57, 6, N'환기', N'실내 환기 시스템', N'실내 환기 시스템이 정상 가동되고 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (58, 6, N'온도/습도', N'사무실 온도 및 습도', N'사무실 온도(18-28°C) 및 습도(40-60%)가 적정한가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (59, 7, N'출입통제', N'출입문 보안 시스템', N'출입문 보안 시스템이 정상 작동하는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (60, 7, N'CCTV', N'CCTV 작동 및 사각지대', N'CCTV가 정상 작동하며 사각지대가 없는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (61, 7, N'개인정보', N'민감 서류 잠금 보관', N'퇴근 시 민감 서류 및 개인정보가 잠금 보관되는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (62, 7, N'방문자', N'외부 방문자 출입 등록', N'외부 방문자에 대한 출입 등록 절차가 준수되고 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (63, 8, N'구급함', N'구급함 비치 및 내용물', N'구급함이 지정 위치에 비치되고 내용물이 충분한가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (64, 8, N'구급함', N'의약품 유효기간', N'구급함 내 의약품 유효기간이 지나지 않았는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (65, 8, N'AED', N'자동심장충격기 위치', N'자동심장충격기(AED)가 접근 가능한 위치에 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (66, 8, N'응급연락처', N'응급 연락처 게시', N'응급 연락처(119, 병원 등)가 눈에 잘 띄는 곳에 게시되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (67, 8, N'교육', N'CPR 및 응급처치 교육', N'CPR 및 응급처치 교육을 이수한 직원이 상주하는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (99, 3, N'소방설비', N'소화기 비치 및 유효기간', N'소화기가 지정된 위치에 비치되어 있으며 유효기간이 유효한가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (100, 3, N'소방설비', N'스프링클러 및 화재 감지기', N'스프링클러 및 화재 감지기가 정상 작동하는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (101, 3, N'비상구', N'비상구 표시등', N'비상구 표시등이 켜져 있고 가시성이 확보되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (102, 3, N'비상구', N'비상구 통로', N'비상구 통로가 막혀 있지 않고 자유롭게 통행 가능한가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (103, 3, N'대피계획', N'화재 대피 경로도', N'화재 대피 경로도가 각 층에 부착되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (104, 3, N'대피계획', N'비상 연락처 및 집결 장소', N'비상 연락처 및 집결 장소가 직원에게 공지되어 있는가?', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO [tb_checklist_template_item] ([id], [master_id], [category], [check_item], [check_content], [is_normal], [is_abnormal], [remarks], [check_standard], [action_taken], [confirm]) VALUES (105, 3, N'대피훈련', N'대피 훈련 실시', N'최근 6개월 이내 대피 훈련이 실시되었는가?', NULL, NULL, NULL, NULL, NULL, NULL);
GO
-- rows: 33
