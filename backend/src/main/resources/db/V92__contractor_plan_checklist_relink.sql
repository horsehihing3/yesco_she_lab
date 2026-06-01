-- V92: 협력사 관리 더미 계획의 checklist_template_id 를 V91 신규 템플릿 5개에 재분배
--   V91 수동 실행 시 UPDATE 구간이 누락되어 연결이 빠진 환경에서 강제 재매핑

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_contractor_plan', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    DECLARE
        @ck1 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 일반 작업 안전점검표'     AND category_type = 'CONTRACTOR'),
        @ck2 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 고소 작업 안전점검표'     AND category_type = 'CONTRACTOR'),
        @ck3 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 전기·감전 작업 안전점검표' AND category_type = 'CONTRACTOR'),
        @ck4 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 화기·용접 작업 안전점검표' AND category_type = 'CONTRACTOR'),
        @ck5 BIGINT = (SELECT id FROM tb_checklist_template WHERE template_name = N'협력사 밀폐공간 작업 안전점검표'   AND category_type = 'CONTRACTOR');

    -- plan_id 패턴이 일치하는 5건 우선 매핑 (idempotent)
    IF @ck1 IS NOT NULL AND @ck2 IS NOT NULL AND @ck3 IS NOT NULL AND @ck4 IS NOT NULL AND @ck5 IS NOT NULL
    BEGIN
        UPDATE tb_contractor_plan SET checklist_template_id = @ck2, modified_at = GETDATE() WHERE plan_id = 'CP-2026-001';
        UPDATE tb_contractor_plan SET checklist_template_id = @ck3, modified_at = GETDATE() WHERE plan_id = 'CP-2026-002';
        UPDATE tb_contractor_plan SET checklist_template_id = @ck1, modified_at = GETDATE() WHERE plan_id = 'CP-2026-003';
        UPDATE tb_contractor_plan SET checklist_template_id = @ck1, modified_at = GETDATE() WHERE plan_id = 'CP-2026-004';
        UPDATE tb_contractor_plan SET checklist_template_id = @ck4, modified_at = GETDATE() WHERE plan_id = 'CP-2026-005';

        -- 그 외 연결 누락된 plan은 ROW_NUMBER 기준으로 5개 템플릿을 균등 분배
        ;WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
            FROM tb_contractor_plan
            WHERE deleted = 0
              AND (checklist_template_id IS NULL
                   OR checklist_template_id NOT IN (@ck1, @ck2, @ck3, @ck4, @ck5))
        )
        UPDATE p
        SET p.checklist_template_id = CASE ((r.rn - 1) % 5)
                                        WHEN 0 THEN @ck1
                                        WHEN 1 THEN @ck2
                                        WHEN 2 THEN @ck3
                                        WHEN 3 THEN @ck4
                                        ELSE       @ck5
                                      END,
            p.modified_at = GETDATE()
        FROM tb_contractor_plan p
        INNER JOIN ranked r ON r.id = p.id;
    END
END
GO
