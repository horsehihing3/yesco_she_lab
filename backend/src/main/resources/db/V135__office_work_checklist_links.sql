-- V135: 위험성 평가 - 사무업무 탭의 3개 Step 각각에 체크리스트 템플릿을 연결.
--   - tb_risk_assessment 에 office_checklist_id, sanup_checklist_id, jungdae_checklist_id 컬럼 추가
--   - 템플릿은 사용자가 체크리스트 관리 화면(3개 신규 탭 OFFICE_WORK / OFFICE_SANUP / OFFICE_JUNGDAE)에서
--     직접 만들어 관리. 자동 시드/백필 안 함.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'office_checklist_id')
        ALTER TABLE tb_risk_assessment ADD office_checklist_id BIGINT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'sanup_checklist_id')
        ALTER TABLE tb_risk_assessment ADD sanup_checklist_id BIGINT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'jungdae_checklist_id')
        ALTER TABLE tb_risk_assessment ADD jungdae_checklist_id BIGINT NULL;
END
GO
