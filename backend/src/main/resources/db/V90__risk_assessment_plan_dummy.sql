-- V90: 위험성평가 계획 탭 더미데이터 추가
--   - V89에서 기존 4건을 모두 'approved'로 옮겨 관리 탭에만 노출되어 계획 탭이 비어있는 문제 해결
--   - 계획 탭용 새 더미 4건 (draft/submitted/rejected) 삽입 + 각각 서로 다른 양식/지역/제목
--   - 연결 상세도 함께 생성

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL
BEGIN
    DECLARE
        @p1 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'계단·정수기 이용'),
        @p2 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'용접·전기 작업'),
        @p3 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'지붕·미화 청소'),
        @p4 BIGINT = (SELECT id FROM tb_risk_assessment_form WHERE title = N'전사행사 기획');

    -- 같은 제목이 이미 있으면 건너뜀 (idempotent)
    IF NOT EXISTS (SELECT 1 FROM tb_risk_assessment WHERE title = N'계단·정수기 이용 위험성평가')
    BEGIN
        INSERT INTO tb_risk_assessment
            (risk_id, form_id, title, site, author_name, author_dept, author_mail, author_company,
             status, risk_register_count, office_count, field_count, allow_resubmit,
             created_at, modified_at)
        VALUES
            (NEWID(), @p1, N'계단·정수기 이용 위험성평가',   N'구리',   N'김윤진', N'노경지원팀', N'', N'', 'draft',     0, 0, 0, 1, GETDATE(), GETDATE()),
            (NEWID(), @p2, N'용접·전기 작업 위험성평가',     N'남양주', N'김윤진', N'노경지원팀', N'', N'', 'submitted', 0, 0, 0, 1, GETDATE(), GETDATE()),
            (NEWID(), @p3, N'지붕·미화 청소 위험성평가',     N'포천',   N'김윤진', N'노경지원팀', N'', N'', 'draft',     0, 0, 0, 1, GETDATE(), GETDATE()),
            (NEWID(), @p4, N'전사행사 기획 위험성평가',       N'가평',   N'김윤진', N'노경지원팀', N'', N'', 'rejected',  0, 0, 0, 1, GETDATE(), GETDATE());
    END

    -- 기존 관리 탭 4건의 site가 비어있으면 채워주기
    UPDATE tb_risk_assessment
    SET site = CASE title
                 WHEN N'PC·문서 업무 위험성평가'       THEN N'구리'
                 WHEN N'시설물·상하수 관리 위험성평가' THEN N'남양주'
                 WHEN N'자재관련 업무 위험성평가'       THEN N'포천'
                 WHEN N'급식·조리 업무 위험성평가'      THEN N'양평'
                 ELSE site
               END,
        author_name = COALESCE(NULLIF(author_name, N''), N'김윤진'),
        author_dept = COALESCE(NULLIF(author_dept, N''), N'노경지원팀'),
        modified_at = GETDATE()
    WHERE title IN (N'PC·문서 업무 위험성평가', N'시설물·상하수 관리 위험성평가', N'자재관련 업무 위험성평가', N'급식·조리 업무 위험성평가');
END
GO

-- 새로 생성한 plan 더미의 detail 생성
IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
AND OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL
BEGIN
    -- 신규 4건의 상세만 추가 (중복 방지 위해 NOT EXISTS)
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
    WHERE a.title IN (
            N'계단·정수기 이용 위험성평가',
            N'용접·전기 작업 위험성평가',
            N'지붕·미화 청소 위험성평가',
            N'전사행사 기획 위험성평가')
      AND NOT EXISTS (
        SELECT 1 FROM tb_risk_assessment_detail d
        WHERE d.risk_id = a.risk_id AND d.risk_idx = i.risk_idx
      );
END
GO
