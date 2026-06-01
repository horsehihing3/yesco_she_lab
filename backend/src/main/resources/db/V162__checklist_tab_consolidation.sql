-- V162: 체크리스트 탭 통합
--   "감사 및 점검" → "감사" : 기존 AUDIT 템플릿 삭제, INDUSTRIAL_SAFETY/SERIOUS_DISASTER 를 AUDIT 로 이동
--   "사무업무"     → "위험성 평가2" : OFFICE_SANUP/OFFICE_JUNGDAE 를 OFFICE_WORK 로 통합
--
-- 마스터 템플릿(is_private = 0) 만 대상, 개인 스냅샷(is_private = 1) 은 변경하지 않음.
-- (스냅샷은 계획별로 이미 만들어진 사본이라 카테고리 변경하면 해당 계획의 표시 위치가 달라지지 않게 보존.)

SET NOCOUNT ON;
GO

-- ===== 1) 기존 AUDIT 마스터 템플릿 + 하위 카테고리·항목 삭제 =====
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_category', 'U') IS NOT NULL
AND OBJECT_ID('tb_checklist_item', 'U') IS NOT NULL
BEGIN
    -- 1-1) 항목 삭제
    DELETE i
    FROM tb_checklist_item i
    INNER JOIN tb_checklist_category c ON c.id = i.category_id
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = N'AUDIT'
      AND ISNULL(t.is_private, 0) = 0;

    -- 1-2) 카테고리 삭제
    DELETE c
    FROM tb_checklist_category c
    INNER JOIN tb_checklist_template t ON t.id = c.template_id
    WHERE t.category_type = N'AUDIT'
      AND ISNULL(t.is_private, 0) = 0;

    -- 1-3) 템플릿 삭제
    DELETE FROM tb_checklist_template
    WHERE category_type = N'AUDIT'
      AND ISNULL(is_private, 0) = 0;
END
GO

-- ===== 2) 산업안전보건법 + 중대재해처벌법 → 감사 (AUDIT) =====
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    UPDATE tb_checklist_template
       SET category_type = N'AUDIT',
           modified_at   = GETDATE()
     WHERE ISNULL(is_private, 0) = 0
       AND (category_type IN (N'INDUSTRIAL_SAFETY', N'SERIOUS_DISASTER')
            OR category_type IS NULL);
END
GO

-- ===== 3) 산안법/중대재해법 예방 사무업무 → 사무업무(OFFICE_WORK) → 위험성 평가2 =====
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    UPDATE tb_checklist_template
       SET category_type = N'OFFICE_WORK',
           modified_at   = GETDATE()
     WHERE ISNULL(is_private, 0) = 0
       AND category_type IN (N'OFFICE_SANUP', N'OFFICE_JUNGDAE');
END
GO

-- ===== 4) CHECKLIST_CATEGORY_TYPE 코드 정리 =====
--   삭제된 탭에 해당하는 코드 비활성화 + 라벨 정리
IF OBJECT_ID('tb_code_group', 'U') IS NOT NULL
AND OBJECT_ID('tb_code_detail', 'U') IS NOT NULL
BEGIN
    DECLARE @clCatTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE');
    IF @clCatTypeId IS NOT NULL
    BEGIN
        -- 미사용 코드 비활성화
        UPDATE tb_code_detail
           SET is_active = 0, modified_at = GETDATE()
         WHERE group_id = @clCatTypeId
           AND code IN ('INDUSTRIAL_SAFETY', 'SERIOUS_DISASTER', 'OFFICE_SANUP', 'OFFICE_JUNGDAE');

        -- AUDIT 라벨 "감사 및 점검" → "감사"
        UPDATE tb_code_detail
           SET code_name_ko = N'감사',
               modified_at  = GETDATE()
         WHERE group_id = @clCatTypeId
           AND code = 'AUDIT';

        -- OFFICE_WORK 라벨 "사무업무" → "위험성 평가2"
        UPDATE tb_code_detail
           SET code_name_ko = N'위험성 평가2',
               code_name_en = 'Risk Assessment 2',
               code_name_zh = N'风险评估2',
               modified_at  = GETDATE()
         WHERE group_id = @clCatTypeId
           AND code = 'OFFICE_WORK';
    END
END
GO
