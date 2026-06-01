-- V138: 위험성 평가 - 사무업무 더미 6건의 office/sanup/jungdae_checklist_id 를
-- V137 에서 시드된 샘플 템플릿으로 자동 연결.
-- 이미 연결되어 있으면 그대로 둠 (사용자 수정 보존).

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'office_checklist_id')
BEGIN
    DECLARE @officeId  BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'사무실 일반 안전 점검표' ORDER BY id);
    DECLARE @sanupId   BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'산업안전보건법 사무직 예방 점검표' ORDER BY id);
    DECLARE @jungdaeId BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'중대재해처벌법 사무직 예방 점검표' ORDER BY id);

    UPDATE tb_risk_assessment
       SET office_checklist_id  = COALESCE(office_checklist_id,  @officeId),
           sanup_checklist_id   = COALESCE(sanup_checklist_id,   @sanupId),
           jungdae_checklist_id = COALESCE(jungdae_checklist_id, @jungdaeId),
           modified_at = GETDATE()
     WHERE title LIKE N'%(사무업무)';
END
GO
