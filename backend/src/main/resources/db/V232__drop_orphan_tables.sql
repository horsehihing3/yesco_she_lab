-- =====================================================================
-- V232: Drop orphan tables (backend code already removed)
-- =====================================================================
-- 대상: 메뉴 미연결 orphan 모듈의 테이블. 백엔드 코드는 아래 커밋에서 선행 제거됨.
--   - 2097f1b: EhsKpiPlan / HazardFactor / WorkplaceMeasurement(+Detail) 코드 제거
--   - 592cfdd: ChecklistTemplate(Master/Item) / ChecklistResult(Master/Item) + ExcelService 제거
-- 백업: db/backup/2026-06-22-orphan-tables/ (커밋 e4c65fe) — 스키마+데이터+FK 복원 가능.
--
-- ⚠️ Flyway는 비활성(enabled=false)이라 이 파일은 자동 실행되지 않음 → 수동 실행 자산.
-- ⚠️ 운영본 적용 전 반드시: 운영 DB 실데이터 유무 재확인 후 실행(되돌릴 수 없음).
--
-- 라이브 테이블과 혼동 금지(절대 삭제 안 함):
--   tb_checklist_template(단수), tb_checklist_item(단수), tb_checklist_category,
--   tb_checklist_inspection, tb_checklist_inspection_result
-- DROP 순서: 자식(FK 참조 측) → 부모.
-- =====================================================================

-- 1) Checklist Template 묶음 (item → master, FK_tpl_item_master ON DELETE CASCADE)
IF OBJECT_ID('dbo.tb_checklist_template_item', 'U') IS NOT NULL
    DROP TABLE dbo.tb_checklist_template_item;
GO
IF OBJECT_ID('dbo.tb_checklist_template_master', 'U') IS NOT NULL
    DROP TABLE dbo.tb_checklist_template_master;
GO

-- 2) Checklist Result 묶음 (클론엔 미존재 — IF EXISTS no-op. 운영본 대비 포함)
IF OBJECT_ID('dbo.tb_checklist_result_item', 'U') IS NOT NULL
    DROP TABLE dbo.tb_checklist_result_item;
GO
IF OBJECT_ID('dbo.tb_checklist_result_master', 'U') IS NOT NULL
    DROP TABLE dbo.tb_checklist_result_master;
GO

-- 3) Workplace Measurement 묶음 (detail → measurement)
IF OBJECT_ID('dbo.tb_workplace_measurement_detail', 'U') IS NOT NULL
    DROP TABLE dbo.tb_workplace_measurement_detail;
GO
IF OBJECT_ID('dbo.tb_workplace_measurement', 'U') IS NOT NULL
    DROP TABLE dbo.tb_workplace_measurement;
GO

-- 4) 독립 테이블
IF OBJECT_ID('dbo.tb_ehs_kpi_plan', 'U') IS NOT NULL
    DROP TABLE dbo.tb_ehs_kpi_plan;
GO
IF OBJECT_ID('dbo.tb_hazard_factor', 'U') IS NOT NULL
    DROP TABLE dbo.tb_hazard_factor;
GO
