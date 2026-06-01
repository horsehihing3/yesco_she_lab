-- V98: 체크리스트 템플릿을 계획(plan) 별로 독립적인 사본(private) 으로 스냅샷
--   목적: 체크리스트 관리에서 원본 템플릿이 삭제되거나 수정되어도
--         이미 계획(협력사/감사/법규/비상/작업허가)에 연결된 체크리스트는 독립적으로 유지
--
--   이후 백엔드 서비스는 계획 생성/수정 시 템플릿을 deep-copy 하여 private 사본을 생성하고
--   계획의 checklist_template_id 를 그 사본으로 교체한다.
--
--   - is_private : 1 이면 계획 전용 사본 (체크리스트 관리 목록에서 제외)
--   - owner_type : 소유 계획 유형 (CONTRACTOR / AUDIT / COMPLIANCE / EMERGENCY / PERMIT)
--   - owner_id   : 소유 계획 row id

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_checklist_template', 'is_private') IS NULL
        ALTER TABLE tb_checklist_template ADD is_private BIT NOT NULL DEFAULT 0;
    IF COL_LENGTH('tb_checklist_template', 'owner_type') IS NULL
        ALTER TABLE tb_checklist_template ADD owner_type NVARCHAR(50) NULL;
    IF COL_LENGTH('tb_checklist_template', 'owner_id') IS NULL
        ALTER TABLE tb_checklist_template ADD owner_id BIGINT NULL;
END
GO

-- is_private 기본값 보정 (ALTER 과정에서 null 이 들어간 경우)
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
AND COL_LENGTH('tb_checklist_template', 'is_private') IS NOT NULL
    UPDATE tb_checklist_template SET is_private = 0 WHERE is_private IS NULL;
GO
