-- V215: 사람 관련 필드 표준화 — liveJoin 제거를 위해 누락된 team/position 컬럼 추가
-- 규칙: 작성자/수정자/계획승인자/완료승인자 모두 {role}_user_id, _name, _team, _position 4개 저장

-- ── tb_ehs_annual_plan ──────────────────────────────────────────
IF COL_LENGTH('tb_ehs_annual_plan','modified_by_team')     IS NULL ALTER TABLE tb_ehs_annual_plan ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_ehs_annual_plan','modified_by_position') IS NULL ALTER TABLE tb_ehs_annual_plan ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_audit_plan ───────────────────────────────────────────────
IF COL_LENGTH('tb_audit_plan','created_by_team')     IS NULL ALTER TABLE tb_audit_plan ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_audit_plan','created_by_position') IS NULL ALTER TABLE tb_audit_plan ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_audit_plan','modified_by_team')     IS NULL ALTER TABLE tb_audit_plan ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_audit_plan','modified_by_position') IS NULL ALTER TABLE tb_audit_plan ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_audit (감사 실시) ────────────────────────────────────────
IF COL_LENGTH('tb_audit','created_by_team')     IS NULL ALTER TABLE tb_audit ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_audit','created_by_position') IS NULL ALTER TABLE tb_audit ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_audit','modified_by_team')     IS NULL ALTER TABLE tb_audit ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_audit','modified_by_position') IS NULL ALTER TABLE tb_audit ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_emergency_plan ───────────────────────────────────────────
IF COL_LENGTH('tb_emergency_plan','modified_by_team')     IS NULL ALTER TABLE tb_emergency_plan ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_emergency_plan','modified_by_position') IS NULL ALTER TABLE tb_emergency_plan ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_health_checkup_plan ──────────────────────────────────────
IF COL_LENGTH('tb_health_checkup_plan','created_by_team')     IS NULL ALTER TABLE tb_health_checkup_plan ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_health_checkup_plan','created_by_position') IS NULL ALTER TABLE tb_health_checkup_plan ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_health_checkup_plan','modified_by_team')     IS NULL ALTER TABLE tb_health_checkup_plan ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_health_checkup_plan','modified_by_position') IS NULL ALTER TABLE tb_health_checkup_plan ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_legal_compliance_exec ────────────────────────────────────
IF COL_LENGTH('tb_legal_compliance_exec','created_by_team')     IS NULL ALTER TABLE tb_legal_compliance_exec ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_legal_compliance_exec','created_by_position') IS NULL ALTER TABLE tb_legal_compliance_exec ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_legal_compliance_exec','modified_by_team')     IS NULL ALTER TABLE tb_legal_compliance_exec ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_legal_compliance_exec','modified_by_position') IS NULL ALTER TABLE tb_legal_compliance_exec ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_legal_compliance_plan ────────────────────────────────────
IF COL_LENGTH('tb_legal_compliance_plan','created_by_team')     IS NULL ALTER TABLE tb_legal_compliance_plan ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_legal_compliance_plan','created_by_position') IS NULL ALTER TABLE tb_legal_compliance_plan ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_legal_compliance_plan','modified_by_team')     IS NULL ALTER TABLE tb_legal_compliance_plan ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_legal_compliance_plan','modified_by_position') IS NULL ALTER TABLE tb_legal_compliance_plan ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_risk_assessment (작성자 userId/team/position 추가) ────────
IF COL_LENGTH('tb_risk_assessment','author_user_id') IS NULL ALTER TABLE tb_risk_assessment ADD author_user_id BIGINT        NULL;
IF COL_LENGTH('tb_risk_assessment','author_team')    IS NULL ALTER TABLE tb_risk_assessment ADD author_team   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_risk_assessment','author_position')IS NULL ALTER TABLE tb_risk_assessment ADD author_position NVARCHAR(50) NULL;

-- ── tb_contractor_plan (작성자 전체 추가) ───────────────────────
IF COL_LENGTH('tb_contractor_plan','created_by_user_id') IS NULL ALTER TABLE tb_contractor_plan ADD created_by_user_id BIGINT        NULL;
IF COL_LENGTH('tb_contractor_plan','created_by_name')    IS NULL ALTER TABLE tb_contractor_plan ADD created_by_name   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_contractor_plan','created_by_team')    IS NULL ALTER TABLE tb_contractor_plan ADD created_by_team   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_contractor_plan','created_by_position')IS NULL ALTER TABLE tb_contractor_plan ADD created_by_position NVARCHAR(50) NULL;

-- ── tb_permit_to_work (작성자 전체 추가) ────────────────────────
IF COL_LENGTH('tb_permit_to_work','created_by_user_id') IS NULL ALTER TABLE tb_permit_to_work ADD created_by_user_id BIGINT        NULL;
IF COL_LENGTH('tb_permit_to_work','created_by_name')    IS NULL ALTER TABLE tb_permit_to_work ADD created_by_name   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_permit_to_work','created_by_team')    IS NULL ALTER TABLE tb_permit_to_work ADD created_by_team   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_permit_to_work','created_by_position')IS NULL ALTER TABLE tb_permit_to_work ADD created_by_position NVARCHAR(50) NULL;

-- ── tb_site_safety_plan (작성자 전체 추가) ──────────────────────
IF COL_LENGTH('tb_site_safety_plan','created_by_user_id') IS NULL ALTER TABLE tb_site_safety_plan ADD created_by_user_id BIGINT        NULL;
IF COL_LENGTH('tb_site_safety_plan','created_by_name')    IS NULL ALTER TABLE tb_site_safety_plan ADD created_by_name   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_site_safety_plan','created_by_team')    IS NULL ALTER TABLE tb_site_safety_plan ADD created_by_team   NVARCHAR(100) NULL;
IF COL_LENGTH('tb_site_safety_plan','created_by_position')IS NULL ALTER TABLE tb_site_safety_plan ADD created_by_position NVARCHAR(50) NULL;
