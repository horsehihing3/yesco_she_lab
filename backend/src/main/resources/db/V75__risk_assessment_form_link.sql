-- V75: 위험성평가에 form_id 컬럼 추가 + 기존 데이터에 양식 연결
-- ALTER TABLE 후 같은 배치에서 컬럼 사용 불가 → 동적 SQL로 분리
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'form_id')
BEGIN
    ALTER TABLE tb_risk_assessment ADD form_id BIGINT NULL;
END;

EXEC sp_executesql N'
DECLARE @fid_A BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''배관설계연구(A)'');
DECLARE @fid_B BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''시설물연구(B)'');
DECLARE @fid_C BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''배관망분석연구(C)'');
DECLARE @fid_D BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''QA(품질보증)연구(D)'');
DECLARE @fid_E BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''GIS정보향상연구(E)'');
DECLARE @fid_F BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title LIKE N''기술자료%'');
DECLARE @fid_I BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''기타업무(I)'');
DECLARE @fid_J BIGINT = (SELECT TOP 1 id FROM tb_risk_assessment_form WHERE title = N''사무공통(J)'');

UPDATE tb_risk_assessment SET form_id = @fid_A WHERE form_id IS NULL AND (title LIKE N''%배관설계%'' OR title LIKE N''%설계%'');
UPDATE tb_risk_assessment SET form_id = @fid_B WHERE form_id IS NULL AND title LIKE N''%시설물%'';
UPDATE tb_risk_assessment SET form_id = @fid_C WHERE form_id IS NULL AND (title LIKE N''%배관망%'' OR title LIKE N''%분석%'');
UPDATE tb_risk_assessment SET form_id = @fid_D WHERE form_id IS NULL AND (title LIKE N''%QA%'' OR title LIKE N''%품질%'');
UPDATE tb_risk_assessment SET form_id = @fid_E WHERE form_id IS NULL AND (title LIKE N''%GIS%'' OR title LIKE N''%정보%'');
UPDATE tb_risk_assessment SET form_id = @fid_F WHERE form_id IS NULL AND (title LIKE N''%기술자료%'' OR title LIKE N''%도면%'');
UPDATE tb_risk_assessment SET form_id = @fid_J WHERE form_id IS NULL AND (title LIKE N''%사무%'' OR title LIKE N''%공통%'');

UPDATE tb_risk_assessment SET form_id = @fid_I WHERE form_id IS NULL;
';
