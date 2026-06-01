-- V63: 협력사 관리 더미데이터 + 체크리스트

-- 일용직 안전 체크리스트
INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
VALUES (N'일용직 안전 점검표', N'협력사 일용직 작업자 안전 점검 항목', 'CONTRACTOR', 'PASS,FAIL,NA', 1, 1, GETDATE(), GETDATE());

DECLARE @ctTmplId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@ctTmplId, N'작업 전 안전교육', 1);
DECLARE @ctCat1 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@ctTmplId, N'개인 보호구 착용', 2);
DECLARE @ctCat2 BIGINT = SCOPE_IDENTITY();
INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@ctTmplId, N'작업 현장 안전', 3);
DECLARE @ctCat3 BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
(@ctCat1, 1, N'필수', N'안전보건교육 이수 확인', N'산업안전보건법 제29조', 1),
(@ctCat1, 2, N'필수', N'작업 위험요인 고지 확인', N'산업안전보건법 제35조', 2),
(@ctCat1, 3, N'필수', N'비상 대피 경로 숙지 확인', '', 3),
(@ctCat1, 4, N'선택', N'작업 절차서 숙지 확인', '', 4),
(@ctCat2, 5, N'필수', N'안전모 착용 상태', N'산업안전보건기준에관한규칙 제32조', 1),
(@ctCat2, 6, N'필수', N'안전화 착용 상태', N'산업안전보건기준에관한규칙 제32조', 2),
(@ctCat2, 7, N'필수', N'안전조끼 착용 상태', '', 3),
(@ctCat2, 8, N'선택', N'작업별 특수 보호구 착용', '', 4),
(@ctCat3, 9, N'필수', N'작업 구역 안전 펜스/표지판 설치', N'산업안전보건법 제37조', 1),
(@ctCat3, 10, N'필수', N'작업 공구/장비 점검 상태', '', 2),
(@ctCat3, 11, N'필수', N'안전 통로 확보 상태', '', 3),
(@ctCat3, 12, N'선택', N'정리정돈 상태', '', 4);

-- 더미 계획 데이터
INSERT INTO tb_contractor_plan (plan_id, title, work_type, risk_level, work_location, workers_count, work_start_date, work_end_date, work_description, safety_measures, required_ppe, hazard_factors, emergency_contact, checklist_template_id, approver_name, repeat_type, repeat_interval, status, deleted) VALUES
(N'CP-2026-001', N'외벽 도장 작업', 'HEIGHT_WORK', 'HIGH', N'본관 외벽', 6, '2026-04-20', '2026-04-25', N'본관 외벽 재도장 작업 (높이 15m)', N'안전대 착용, 낙하물 방지망 설치, 강풍 시 작업 중지', N'안전대 (전신식), 안전모 (ABS), 안전화 (경량)', N'추락, 낙하물, 도료 흡입', N'안전팀 119', @ctTmplId, N'김안전', 'DAILY', 1, 'APPROVED', 0),
(N'CP-2026-002', N'전기 배선 공사', 'ELECTRICAL', 'HIGH', N'생산동 2층', 4, '2026-04-22', '2026-04-24', N'생산동 2층 전기 배선 교체 작업', N'정전 작업(LOTO), 검전 확인, 절연장갑 착용', N'안전모 (ABS), 안전화 (경량), 내화학성 장갑', N'감전, 아크 플래시', N'전기안전팀 300', @ctTmplId, N'이관리', 'NONE', 1, 'REQUESTED', 0),
(N'CP-2026-003', N'냉난방 설비 점검', 'OTHER', 'MEDIUM', N'전체 건물', 3, '2026-05-01', '2026-05-03', N'냉난방 설비 정기 점검 및 필터 교체', N'전원 차단 후 작업, 고소작업 시 안전대 착용', N'안전모 (ABS), 안전화 (경량)', N'추락, 감전', N'설비팀 250', @ctTmplId, NULL, 'MONTHLY', 1, 'DRAFT', 0),
(N'CP-2026-004', N'주차장 라인 도색', 'OTHER', 'LOW', N'지하 주차장', 5, '2026-05-10', '2026-05-11', N'지하 주차장 주차 라인 재도색', N'환기 실시, 유기용제 MSDS 비치', N'방진 마스크 KF94, 내화학성 장갑', N'유기용제 흡입, 미끄러짐', N'안전팀 119', @ctTmplId, N'박환경', 'NONE', 1, 'APPROVED', 0),
(N'CP-2026-005', N'소방 설비 교체', 'OTHER', 'MEDIUM', N'전체 건물', 4, '2026-05-15', '2026-05-20', N'노후 소방 설비(감지기, 스프링클러) 교체', N'화재 감시자 배치, 소화기 비치', N'안전모 (ABS), 안전화 (경량)', N'화재, 감전', N'소방팀 400', @ctTmplId, N'정소방', 'NONE', 1, 'DRAFT', 0);

-- 대상자 더미
INSERT INTO tb_contractor_worker (plan_id, worker_name, worker_phone, company_name) VALUES
(1, N'홍길동', '010-1234-5678', N'대한건설'),
(1, N'김철수', '010-2345-6789', N'대한건설'),
(1, N'이영희', '010-3456-7890', N'대한건설'),
(2, N'박민수', '010-4567-8901', N'한국전기'),
(2, N'최지은', '010-5678-9012', N'한국전기'),
(4, N'정대호', '010-6789-0123', N'미래도장'),
(4, N'한미래', '010-7890-1234', N'미래도장');
