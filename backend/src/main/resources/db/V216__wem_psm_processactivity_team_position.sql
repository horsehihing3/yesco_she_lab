-- V216: WEM / PSM / ProcessActivity 작성자·수정자 team/position 컬럼 추가
-- 규칙: created_by_team, created_by_position, modified_by_team, modified_by_position

-- ── tb_process_activity_form ─────────────────────────────────────
IF COL_LENGTH('tb_process_activity_form','created_by_team')     IS NULL ALTER TABLE tb_process_activity_form ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_process_activity_form','created_by_position') IS NULL ALTER TABLE tb_process_activity_form ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_process_activity_form','modified_by_team')     IS NULL ALTER TABLE tb_process_activity_form ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_process_activity_form','modified_by_position') IS NULL ALTER TABLE tb_process_activity_form ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_wem_plan ──────────────────────────────────────────────────
IF COL_LENGTH('tb_wem_plan','created_by_team')     IS NULL ALTER TABLE tb_wem_plan ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_plan','created_by_position') IS NULL ALTER TABLE tb_wem_plan ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_wem_plan','modified_by_team')     IS NULL ALTER TABLE tb_wem_plan ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_plan','modified_by_position') IS NULL ALTER TABLE tb_wem_plan ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_wem_result ────────────────────────────────────────────────
IF COL_LENGTH('tb_wem_result','created_by_team')     IS NULL ALTER TABLE tb_wem_result ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_result','created_by_position') IS NULL ALTER TABLE tb_wem_result ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_wem_result','modified_by_team')     IS NULL ALTER TABLE tb_wem_result ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_result','modified_by_position') IS NULL ALTER TABLE tb_wem_result ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_wem_factor ────────────────────────────────────────────────
IF COL_LENGTH('tb_wem_factor','created_by_team')     IS NULL ALTER TABLE tb_wem_factor ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_factor','created_by_position') IS NULL ALTER TABLE tb_wem_factor ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_wem_factor','modified_by_team')     IS NULL ALTER TABLE tb_wem_factor ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_factor','modified_by_position') IS NULL ALTER TABLE tb_wem_factor ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_wem_improvement ───────────────────────────────────────────
IF COL_LENGTH('tb_wem_improvement','created_by_team')     IS NULL ALTER TABLE tb_wem_improvement ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_improvement','created_by_position') IS NULL ALTER TABLE tb_wem_improvement ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_wem_improvement','modified_by_team')     IS NULL ALTER TABLE tb_wem_improvement ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_wem_improvement','modified_by_position') IS NULL ALTER TABLE tb_wem_improvement ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_psm_data ──────────────────────────────────────────────────
IF COL_LENGTH('tb_psm_data','created_by_team')     IS NULL ALTER TABLE tb_psm_data ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_data','created_by_position') IS NULL ALTER TABLE tb_psm_data ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_psm_data','modified_by_team')     IS NULL ALTER TABLE tb_psm_data ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_data','modified_by_position') IS NULL ALTER TABLE tb_psm_data ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_psm_hazop ─────────────────────────────────────────────────
IF COL_LENGTH('tb_psm_hazop','created_by_team')     IS NULL ALTER TABLE tb_psm_hazop ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_hazop','created_by_position') IS NULL ALTER TABLE tb_psm_hazop ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_psm_hazop','modified_by_team')     IS NULL ALTER TABLE tb_psm_hazop ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_hazop','modified_by_position') IS NULL ALTER TABLE tb_psm_hazop ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_psm_moc ───────────────────────────────────────────────────
IF COL_LENGTH('tb_psm_moc','created_by_team')     IS NULL ALTER TABLE tb_psm_moc ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_moc','created_by_position') IS NULL ALTER TABLE tb_psm_moc ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_psm_moc','modified_by_team')     IS NULL ALTER TABLE tb_psm_moc ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_moc','modified_by_position') IS NULL ALTER TABLE tb_psm_moc ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_psm_incident ──────────────────────────────────────────────
IF COL_LENGTH('tb_psm_incident','created_by_team')     IS NULL ALTER TABLE tb_psm_incident ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_incident','created_by_position') IS NULL ALTER TABLE tb_psm_incident ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_psm_incident','modified_by_team')     IS NULL ALTER TABLE tb_psm_incident ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_incident','modified_by_position') IS NULL ALTER TABLE tb_psm_incident ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_psm_ptw ───────────────────────────────────────────────────
IF COL_LENGTH('tb_psm_ptw','created_by_team')     IS NULL ALTER TABLE tb_psm_ptw ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_ptw','created_by_position') IS NULL ALTER TABLE tb_psm_ptw ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_psm_ptw','modified_by_team')     IS NULL ALTER TABLE tb_psm_ptw ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_ptw','modified_by_position') IS NULL ALTER TABLE tb_psm_ptw ADD modified_by_position NVARCHAR(50)  NULL;

-- ── tb_psm_wo ────────────────────────────────────────────────────
IF COL_LENGTH('tb_psm_wo','created_by_team')     IS NULL ALTER TABLE tb_psm_wo ADD created_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_wo','created_by_position') IS NULL ALTER TABLE tb_psm_wo ADD created_by_position NVARCHAR(50)  NULL;
IF COL_LENGTH('tb_psm_wo','modified_by_team')     IS NULL ALTER TABLE tb_psm_wo ADD modified_by_team     NVARCHAR(100) NULL;
IF COL_LENGTH('tb_psm_wo','modified_by_position') IS NULL ALTER TABLE tb_psm_wo ADD modified_by_position NVARCHAR(50)  NULL;
