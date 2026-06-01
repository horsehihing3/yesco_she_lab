-- V136: V135 이전 잘못된 시드(자동 생성된 사무업무 템플릿 3건) 정리.
-- 사용자가 체크리스트 관리에서 직접 만들어야 하므로 자동 시드된 빈 템플릿만 삭제.
--   - 카테고리/항목 row 가 0건인 경우만 삭제 (사용자가 항목을 추가했다면 보존)
--   - 동일 템플릿을 참조하던 위험성 평가의 office/sanup/jungdae_checklist_id 도 NULL 로 정리

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    DECLARE @names TABLE (n NVARCHAR(200));
    INSERT INTO @names VALUES (N'사무업무'), (N'산업안전보건법 예방 사무업무'), (N'중대재해처벌법 예방 사무업무');

    -- 1) 위험성 평가에서 해당 템플릿 참조 NULL 처리
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'office_checklist_id')
    BEGIN
        UPDATE a
           SET office_checklist_id = CASE WHEN ot.id IS NOT NULL THEN NULL ELSE office_checklist_id END,
               sanup_checklist_id  = CASE WHEN st.id IS NOT NULL THEN NULL ELSE sanup_checklist_id END,
               jungdae_checklist_id = CASE WHEN jt.id IS NOT NULL THEN NULL ELSE jungdae_checklist_id END,
               modified_at = GETDATE()
          FROM tb_risk_assessment a
          LEFT JOIN tb_checklist_template ot ON ot.id = a.office_checklist_id  AND ot.template_name = N'사무업무'
          LEFT JOIN tb_checklist_template st ON st.id = a.sanup_checklist_id   AND st.template_name = N'산업안전보건법 예방 사무업무'
          LEFT JOIN tb_checklist_template jt ON jt.id = a.jungdae_checklist_id AND jt.template_name = N'중대재해처벌법 예방 사무업무'
         WHERE ot.id IS NOT NULL OR st.id IS NOT NULL OR jt.id IS NOT NULL;
    END

    -- 2) 항목/카테고리가 0건인 템플릿만 삭제
    DELETE t
      FROM tb_checklist_template t
      INNER JOIN @names n ON n.n = t.template_name
     WHERE t.category_type = 'OFFICE_WORK'
       AND NOT EXISTS (SELECT 1 FROM tb_checklist_category c WHERE c.template_id = t.id);
END
GO
