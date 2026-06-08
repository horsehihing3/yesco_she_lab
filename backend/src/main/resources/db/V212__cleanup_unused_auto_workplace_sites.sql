-- ============================================================
-- V212: V211 에서 자동 등록된 사업장 중 실제로 도면이 site 컬럼으로 참조하지 않는
--       사업장(=과대 등록분)을 soft-delete
--   - 판별 조건:
--       1) 옵션 필드(코드/유형/업종/주소/등록번호/담당자/설립일/연락처/위험등급/비고)가 모두 NULL
--          → V211 자동 등록 휴리스틱
--       2) 어떤 활성 도면도 site 컬럼으로 이 사업장명을 참조하지 않음
--          → 도면 트리에서 사실상 빈 그룹
--   - 옵션 필드가 채워진 사업장(=사용자가 수기 등록/보강한 것)은 그대로 둠
-- ============================================================

SET NOCOUNT ON;
GO

UPDATE tb_workplace_site
SET active = 0, modified_at = GETDATE()
WHERE active = 1
  AND site_code            IS NULL
  AND site_type            IS NULL
  AND industry             IS NULL
  AND address              IS NULL
  AND business_reg_no      IS NULL
  AND she_manager          IS NULL
  AND established_date     IS NULL
  AND representative_contact IS NULL
  AND risk_grade           IS NULL
  AND notes                IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM tb_floor_drawing fd
      WHERE fd.active = 1 AND fd.site = tb_workplace_site.site_name
  );
GO
