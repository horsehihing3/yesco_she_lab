-- V99: V97/V98 에 맞춰 체크리스트 관련 더미 재구성
--   [V97 / 위험성 평가]
--     V95 가 form_id 를 모두 NULL 로 초기화했으므로, 평가 제목에 맞는 form 에 재연결하고
--     form_title 스냅샷을 채움. detail 도 해당 form item 에 맞게 재생성.
--   [V98 / 5개 계획 메뉴]
--     협력사/감사/법규/비상/작업허가 계획의 checklist_template_id 가 public 템플릿을 가리키면
--     deep-copy (template + categories + items) 하여 계획 전용 private 사본으로 교체.

SET NOCOUNT ON;
GO

-- =============================================
-- V97 / 위험성 평가 계획 더미 재연결
--   평가 제목 패턴 → form 매핑
-- =============================================

IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
BEGIN
    -- 1) V80/V90 계열 타이틀 → V95 의 10개 form 에 맞춰 재연결
    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'사무공통(A)'
    WHERE a.title IN (N'PC·문서 업무 위험성평가', N'계단·정수기 이용 위험성평가');

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'영선관리 업무(B)'
    WHERE a.title IN (N'시설물·상하수 관리 위험성평가');

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'차량관리 업무(C)'
    WHERE a.title LIKE N'%차량%';

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'전사 행사 관리(D)'
    WHERE a.title LIKE N'%전사행사%' OR a.title LIKE N'%전사 행사%';

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'자재관련 업무(E)'
    WHERE a.title LIKE N'%자재%';

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'전사 보건업무(F)'
    WHERE a.title LIKE N'%지붕%' OR a.title LIKE N'%미화%';

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'구내식당 운영 및 관리(H)'
    WHERE a.title LIKE N'%급식%' OR a.title LIKE N'%조리%';

    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'사무공통(A)'
    WHERE a.form_id IS NULL AND a.title LIKE N'%용접%';

    -- 2) 나머지 form_id NULL 인 건은 "사무공통(A)" 로 기본 매핑
    UPDATE a SET form_id = f.id, form_title = f.title, modified_at = GETDATE()
    FROM tb_risk_assessment a INNER JOIN tb_risk_assessment_form f
      ON f.title = N'사무공통(A)'
    WHERE a.form_id IS NULL;
END
GO

-- 3) detail 재생성 (기존 detail 은 V95 에서 이미 삭제됨)
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
BEGIN
    INSERT INTO tb_risk_assessment_detail (
        risk_id, activity_process_id, risk_idx, major_category,
        detail_action, risk_4m, danger, expected_disaster, target, current_safety_measures,
        possibility_grade, result_grade, risk_score, risk_grade, is_registered,
        reduction_measures,
        improved_possibility_grade, improved_result_grade, improved_risk_score, improved_risk_grade,
        created_at
    )
    SELECT
        a.risk_id, 0, i.risk_idx, N'사무업무',
        i.detail_action, i.risk_4m, i.danger, i.expected_disaster, i.target, i.current_safety_measures,
        NULL, NULL, NULL, NULL, 0,
        N'',
        NULL, NULL, NULL, NULL,
        GETDATE()
    FROM tb_risk_assessment a
    INNER JOIN tb_risk_assessment_form_item i ON i.form_id = a.form_id
    WHERE a.form_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tb_risk_assessment_detail d
        WHERE d.risk_id = a.risk_id AND d.risk_idx = i.risk_idx
      );
END
GO

-- =============================================
-- CONTRACTOR
-- =============================================

IF OBJECT_ID('tb_contractor_plan', 'U') IS NOT NULL
BEGIN
    DECLARE @pid BIGINT, @src BIGINT, @newTpl BIGINT;
    DECLARE @oldCat BIGINT, @newCat BIGINT, @catName NVARCHAR(500), @catSort INT;

    DECLARE planCur CURSOR LOCAL FOR
        SELECT cp.id, cp.checklist_template_id
        FROM tb_contractor_plan cp
        INNER JOIN tb_checklist_template t ON t.id = cp.checklist_template_id
        WHERE cp.deleted = 0
          AND cp.checklist_template_id IS NOT NULL
          AND ISNULL(t.is_private, 0) = 0;

    OPEN planCur;
    FETCH NEXT FROM planCur INTO @pid, @src;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO tb_checklist_template
            (template_name, description, category_type, result_options, sort_order, is_active,
             inspector_name, inspector_sign, inspector_sign_date,
             reviewer_name, reviewer_sign, reviewer_sign_date,
             approver_name, approver_sign, approver_sign_date,
             is_private, owner_type, owner_id, created_at, modified_at)
        SELECT template_name, description, category_type, result_options, sort_order, 1,
               inspector_name, inspector_sign, inspector_sign_date,
               reviewer_name, reviewer_sign, reviewer_sign_date,
               approver_name, approver_sign, approver_sign_date,
               1, N'CONTRACTOR', @pid, GETDATE(), GETDATE()
        FROM tb_checklist_template WHERE id = @src;

        SET @newTpl = SCOPE_IDENTITY();
        UPDATE tb_contractor_plan SET checklist_template_id = @newTpl, modified_at = GETDATE() WHERE id = @pid;

        DECLARE catCurC CURSOR LOCAL FOR
            SELECT id, category_name, sort_order FROM tb_checklist_category WHERE template_id = @src ORDER BY sort_order, id;
        OPEN catCurC;
        FETCH NEXT FROM catCurC INTO @oldCat, @catName, @catSort;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO tb_checklist_category (template_id, category_name, sort_order, created_at, modified_at)
            VALUES (@newTpl, @catName, @catSort, GETDATE(), GETDATE());
            SET @newCat = SCOPE_IDENTITY();

            INSERT INTO tb_checklist_item
                (category_id, item_no, classification, check_item, legal_basis,
                 check_result, finding, action_deadline, action_complete, sort_order, created_at, modified_at)
            SELECT @newCat, item_no, classification, check_item, legal_basis,
                   check_result, finding, action_deadline, action_complete, sort_order, GETDATE(), GETDATE()
            FROM tb_checklist_item WHERE category_id = @oldCat;

            FETCH NEXT FROM catCurC INTO @oldCat, @catName, @catSort;
        END
        CLOSE catCurC; DEALLOCATE catCurC;

        FETCH NEXT FROM planCur INTO @pid, @src;
    END
    CLOSE planCur; DEALLOCATE planCur;
END
GO

-- =============================================
-- AUDIT
-- =============================================

IF OBJECT_ID('tb_audit_plan', 'U') IS NOT NULL
BEGIN
    DECLARE @pid BIGINT, @src BIGINT, @newTpl BIGINT;
    DECLARE @oldCat BIGINT, @newCat BIGINT, @catName NVARCHAR(500), @catSort INT;

    DECLARE planCur CURSOR LOCAL FOR
        SELECT ap.id, ap.checklist_template_id
        FROM tb_audit_plan ap
        INNER JOIN tb_checklist_template t ON t.id = ap.checklist_template_id
        WHERE ISNULL(ap.deleted, 0) = 0
          AND ap.checklist_template_id IS NOT NULL
          AND ISNULL(t.is_private, 0) = 0;

    OPEN planCur;
    FETCH NEXT FROM planCur INTO @pid, @src;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO tb_checklist_template
            (template_name, description, category_type, result_options, sort_order, is_active,
             inspector_name, inspector_sign, inspector_sign_date,
             reviewer_name, reviewer_sign, reviewer_sign_date,
             approver_name, approver_sign, approver_sign_date,
             is_private, owner_type, owner_id, created_at, modified_at)
        SELECT template_name, description, category_type, result_options, sort_order, 1,
               inspector_name, inspector_sign, inspector_sign_date,
               reviewer_name, reviewer_sign, reviewer_sign_date,
               approver_name, approver_sign, approver_sign_date,
               1, N'AUDIT', @pid, GETDATE(), GETDATE()
        FROM tb_checklist_template WHERE id = @src;

        SET @newTpl = SCOPE_IDENTITY();
        UPDATE tb_audit_plan SET checklist_template_id = @newTpl WHERE id = @pid;

        DECLARE catCurA CURSOR LOCAL FOR
            SELECT id, category_name, sort_order FROM tb_checklist_category WHERE template_id = @src ORDER BY sort_order, id;
        OPEN catCurA;
        FETCH NEXT FROM catCurA INTO @oldCat, @catName, @catSort;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO tb_checklist_category (template_id, category_name, sort_order, created_at, modified_at)
            VALUES (@newTpl, @catName, @catSort, GETDATE(), GETDATE());
            SET @newCat = SCOPE_IDENTITY();

            INSERT INTO tb_checklist_item
                (category_id, item_no, classification, check_item, legal_basis,
                 check_result, finding, action_deadline, action_complete, sort_order, created_at, modified_at)
            SELECT @newCat, item_no, classification, check_item, legal_basis,
                   check_result, finding, action_deadline, action_complete, sort_order, GETDATE(), GETDATE()
            FROM tb_checklist_item WHERE category_id = @oldCat;

            FETCH NEXT FROM catCurA INTO @oldCat, @catName, @catSort;
        END
        CLOSE catCurA; DEALLOCATE catCurA;

        FETCH NEXT FROM planCur INTO @pid, @src;
    END
    CLOSE planCur; DEALLOCATE planCur;
END
GO

-- =============================================
-- COMPLIANCE
-- =============================================

IF OBJECT_ID('tb_compliance_plan', 'U') IS NOT NULL
BEGIN
    DECLARE @pid BIGINT, @src BIGINT, @newTpl BIGINT;
    DECLARE @oldCat BIGINT, @newCat BIGINT, @catName NVARCHAR(500), @catSort INT;

    DECLARE planCur CURSOR LOCAL FOR
        SELECT cp.id, cp.checklist_template_id
        FROM tb_compliance_plan cp
        INNER JOIN tb_checklist_template t ON t.id = cp.checklist_template_id
        WHERE ISNULL(cp.deleted, 0) = 0
          AND cp.checklist_template_id IS NOT NULL
          AND ISNULL(t.is_private, 0) = 0;

    OPEN planCur;
    FETCH NEXT FROM planCur INTO @pid, @src;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO tb_checklist_template
            (template_name, description, category_type, result_options, sort_order, is_active,
             inspector_name, inspector_sign, inspector_sign_date,
             reviewer_name, reviewer_sign, reviewer_sign_date,
             approver_name, approver_sign, approver_sign_date,
             is_private, owner_type, owner_id, created_at, modified_at)
        SELECT template_name, description, category_type, result_options, sort_order, 1,
               inspector_name, inspector_sign, inspector_sign_date,
               reviewer_name, reviewer_sign, reviewer_sign_date,
               approver_name, approver_sign, approver_sign_date,
               1, N'COMPLIANCE', @pid, GETDATE(), GETDATE()
        FROM tb_checklist_template WHERE id = @src;

        SET @newTpl = SCOPE_IDENTITY();
        UPDATE tb_compliance_plan SET checklist_template_id = @newTpl WHERE id = @pid;

        DECLARE catCurCm CURSOR LOCAL FOR
            SELECT id, category_name, sort_order FROM tb_checklist_category WHERE template_id = @src ORDER BY sort_order, id;
        OPEN catCurCm;
        FETCH NEXT FROM catCurCm INTO @oldCat, @catName, @catSort;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO tb_checklist_category (template_id, category_name, sort_order, created_at, modified_at)
            VALUES (@newTpl, @catName, @catSort, GETDATE(), GETDATE());
            SET @newCat = SCOPE_IDENTITY();

            INSERT INTO tb_checklist_item
                (category_id, item_no, classification, check_item, legal_basis,
                 check_result, finding, action_deadline, action_complete, sort_order, created_at, modified_at)
            SELECT @newCat, item_no, classification, check_item, legal_basis,
                   check_result, finding, action_deadline, action_complete, sort_order, GETDATE(), GETDATE()
            FROM tb_checklist_item WHERE category_id = @oldCat;

            FETCH NEXT FROM catCurCm INTO @oldCat, @catName, @catSort;
        END
        CLOSE catCurCm; DEALLOCATE catCurCm;

        FETCH NEXT FROM planCur INTO @pid, @src;
    END
    CLOSE planCur; DEALLOCATE planCur;
END
GO

-- =============================================
-- EMERGENCY
-- =============================================

IF OBJECT_ID('tb_emergency_plan', 'U') IS NOT NULL
BEGIN
    DECLARE @pid BIGINT, @src BIGINT, @newTpl BIGINT;
    DECLARE @oldCat BIGINT, @newCat BIGINT, @catName NVARCHAR(500), @catSort INT;

    DECLARE planCur CURSOR LOCAL FOR
        SELECT ep.id, ep.checklist_template_id
        FROM tb_emergency_plan ep
        INNER JOIN tb_checklist_template t ON t.id = ep.checklist_template_id
        WHERE ISNULL(ep.deleted, 0) = 0
          AND ep.checklist_template_id IS NOT NULL
          AND ISNULL(t.is_private, 0) = 0;

    OPEN planCur;
    FETCH NEXT FROM planCur INTO @pid, @src;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO tb_checklist_template
            (template_name, description, category_type, result_options, sort_order, is_active,
             inspector_name, inspector_sign, inspector_sign_date,
             reviewer_name, reviewer_sign, reviewer_sign_date,
             approver_name, approver_sign, approver_sign_date,
             is_private, owner_type, owner_id, created_at, modified_at)
        SELECT template_name, description, category_type, result_options, sort_order, 1,
               inspector_name, inspector_sign, inspector_sign_date,
               reviewer_name, reviewer_sign, reviewer_sign_date,
               approver_name, approver_sign, approver_sign_date,
               1, N'EMERGENCY', @pid, GETDATE(), GETDATE()
        FROM tb_checklist_template WHERE id = @src;

        SET @newTpl = SCOPE_IDENTITY();
        UPDATE tb_emergency_plan SET checklist_template_id = @newTpl WHERE id = @pid;

        DECLARE catCurEm CURSOR LOCAL FOR
            SELECT id, category_name, sort_order FROM tb_checklist_category WHERE template_id = @src ORDER BY sort_order, id;
        OPEN catCurEm;
        FETCH NEXT FROM catCurEm INTO @oldCat, @catName, @catSort;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO tb_checklist_category (template_id, category_name, sort_order, created_at, modified_at)
            VALUES (@newTpl, @catName, @catSort, GETDATE(), GETDATE());
            SET @newCat = SCOPE_IDENTITY();

            INSERT INTO tb_checklist_item
                (category_id, item_no, classification, check_item, legal_basis,
                 check_result, finding, action_deadline, action_complete, sort_order, created_at, modified_at)
            SELECT @newCat, item_no, classification, check_item, legal_basis,
                   check_result, finding, action_deadline, action_complete, sort_order, GETDATE(), GETDATE()
            FROM tb_checklist_item WHERE category_id = @oldCat;

            FETCH NEXT FROM catCurEm INTO @oldCat, @catName, @catSort;
        END
        CLOSE catCurEm; DEALLOCATE catCurEm;

        FETCH NEXT FROM planCur INTO @pid, @src;
    END
    CLOSE planCur; DEALLOCATE planCur;
END
GO

-- =============================================
-- PERMIT
-- =============================================

IF OBJECT_ID('tb_permit_to_work', 'U') IS NOT NULL
BEGIN
    DECLARE @pid BIGINT, @src BIGINT, @newTpl BIGINT;
    DECLARE @oldCat BIGINT, @newCat BIGINT, @catName NVARCHAR(500), @catSort INT;

    DECLARE planCur CURSOR LOCAL FOR
        SELECT pw.id, pw.checklist_template_id
        FROM tb_permit_to_work pw
        INNER JOIN tb_checklist_template t ON t.id = pw.checklist_template_id
        WHERE ISNULL(pw.deleted, 0) = 0
          AND pw.checklist_template_id IS NOT NULL
          AND ISNULL(t.is_private, 0) = 0;

    OPEN planCur;
    FETCH NEXT FROM planCur INTO @pid, @src;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO tb_checklist_template
            (template_name, description, category_type, result_options, sort_order, is_active,
             inspector_name, inspector_sign, inspector_sign_date,
             reviewer_name, reviewer_sign, reviewer_sign_date,
             approver_name, approver_sign, approver_sign_date,
             is_private, owner_type, owner_id, created_at, modified_at)
        SELECT template_name, description, category_type, result_options, sort_order, 1,
               inspector_name, inspector_sign, inspector_sign_date,
               reviewer_name, reviewer_sign, reviewer_sign_date,
               approver_name, approver_sign, approver_sign_date,
               1, N'PERMIT', @pid, GETDATE(), GETDATE()
        FROM tb_checklist_template WHERE id = @src;

        SET @newTpl = SCOPE_IDENTITY();
        UPDATE tb_permit_to_work SET checklist_template_id = @newTpl WHERE id = @pid;

        DECLARE catCurPm CURSOR LOCAL FOR
            SELECT id, category_name, sort_order FROM tb_checklist_category WHERE template_id = @src ORDER BY sort_order, id;
        OPEN catCurPm;
        FETCH NEXT FROM catCurPm INTO @oldCat, @catName, @catSort;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO tb_checklist_category (template_id, category_name, sort_order, created_at, modified_at)
            VALUES (@newTpl, @catName, @catSort, GETDATE(), GETDATE());
            SET @newCat = SCOPE_IDENTITY();

            INSERT INTO tb_checklist_item
                (category_id, item_no, classification, check_item, legal_basis,
                 check_result, finding, action_deadline, action_complete, sort_order, created_at, modified_at)
            SELECT @newCat, item_no, classification, check_item, legal_basis,
                   check_result, finding, action_deadline, action_complete, sort_order, GETDATE(), GETDATE()
            FROM tb_checklist_item WHERE category_id = @oldCat;

            FETCH NEXT FROM catCurPm INTO @oldCat, @catName, @catSort;
        END
        CLOSE catCurPm; DEALLOCATE catCurPm;

        FETCH NEXT FROM planCur INTO @pid, @src;
    END
    CLOSE planCur; DEALLOCATE planCur;
END
GO
