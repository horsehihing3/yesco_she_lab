-- V100: 공정/활동별 작업내용 (양식4) 메뉴 스키마 + 더미데이터
--   안전관리 하위 "공정/활동별 작업내용" 메뉴용.
--   1) tb_process_activity_form    - 작성서 마스터 (제목/상세/부문/부서/평가자/작성일자/팀참여자)
--   2) tb_process_activity_process - 소분류(공정/활동) 행. 대분류+중분류+소분류 제목
--   3) tb_process_activity_item    - 소분류 내 작업내용 행. 순번/작업내용/평가제외/적용법규

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_process_activity_form', 'U') IS NULL
BEGIN
    CREATE TABLE tb_process_activity_form (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        title           NVARCHAR(500) NOT NULL,
        description     NVARCHAR(MAX) NULL,
        division_name   NVARCHAR(200) NULL,  -- 부문명
        department_name NVARCHAR(200) NULL,  -- 부서(팀)명
        evaluator       NVARCHAR(500) NULL,  -- 평가자 (쉼표로 여러 명)
        creation_date   DATE NULL,           -- 작성일자
        team_members    NVARCHAR(MAX) NULL,  -- 팀 참여자
        created_at      DATETIME2 DEFAULT GETDATE(),
        modified_at     DATETIME2 DEFAULT GETDATE()
    );
END
GO

IF OBJECT_ID('tb_process_activity_process', 'U') IS NULL
BEGIN
    CREATE TABLE tb_process_activity_process (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        form_id         BIGINT NOT NULL,
        major_category  NVARCHAR(200) NULL,  -- 대분류
        middle_category NVARCHAR(200) NULL,  -- 중분류
        sub_category    NVARCHAR(500) NULL,  -- 소분류 (공정/활동)
        sort_order      INT DEFAULT 0,
        created_at      DATETIME2 DEFAULT GETDATE(),
        modified_at     DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX idx_process_activity_process_form ON tb_process_activity_process(form_id);
END
GO

IF OBJECT_ID('tb_process_activity_item', 'U') IS NULL
BEGIN
    CREATE TABLE tb_process_activity_item (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        process_id      BIGINT NOT NULL,
        item_no         INT NULL,            -- No (순번)
        work_content    NVARCHAR(1000) NULL, -- 작업내용
        exclude_eval    BIT DEFAULT 0,       -- 평가제외
        applicable_law  NVARCHAR(MAX) NULL,  -- 적용되는 법규 및 법 조항 내용
        sort_order      INT DEFAULT 0,
        created_at      DATETIME2 DEFAULT GETDATE(),
        modified_at     DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX idx_process_activity_item_process ON tb_process_activity_item(process_id);
END
GO

-- =============================================
-- 더미 데이터 (노경지원팀 양식4 기준)
-- =============================================

IF NOT EXISTS (SELECT 1 FROM tb_process_activity_form WHERE title = N'노경지원팀 공정/활동별 작업내용')
BEGIN
    INSERT INTO tb_process_activity_form (title, description, division_name, department_name, evaluator, creation_date, team_members)
    VALUES (
        N'노경지원팀 공정/활동별 작업내용',
        N'2025년 노경지원팀 위험성평가 대상 공정/활동별 작업내용 조사서',
        N'경영지원부문',
        N'노경지원팀',
        N'김윤진',
        '2025-05-12',
        N'홍성기, 박기덕, 강재훈, 김윤중, 이인화, 김윤진, 김인정, 장희석, 박정환, 임윤진, 한미양, 고아라, 이원일'
    );

    DECLARE @fid BIGINT = SCOPE_IDENTITY();
    DECLARE @pid BIGINT;

    -- 1) 사무 공통사항
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'사무 공통사항', 1);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'서류정리 작업',       1, N'', 1),
    (@pid, 2, N'PC사용',                1, N'', 2),
    (@pid, 3, N'사무용품 사용',          1, N'', 3),
    (@pid, 4, N'복사기/팩시밀리 사용',  1, N'', 4),
    (@pid, 5, N'문서 이동 작업',         1, N'', 5),
    (@pid, 6, N'계단 보행',              0, N'', 6),
    (@pid, 7, N'얼음정수기 사용',        0, N'', 7);

    -- 2) 노무관리 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'노무관리 업무', 2);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'PC사용 및 Paper Work', 1, N'', 1);

    -- 3) 영선관리 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'영선관리 업무', 3);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'부지내 시설물 관리', 0, N'', 1),
    (@pid, 2, N'상하수도 관리',      1, N'상수도법, 하수도법', 2),
    (@pid, 3, N'조경수 관리',        1, N'', 3),
    (@pid, 4, N'소방관리',           1, N'소방관리법', 4),
    (@pid, 5, N'전기시설 관리',      1, N'전기사업법', 5),
    (@pid, 6, N'방역관리',           1, N'', 6),
    (@pid, 7, N'청소 미화관리',      1, N'', 7);

    -- 4) 개인정보보호 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'개인정보보호 업무', 4);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'서류정리 작업', 1, N'개인정보보호법', 1);

    -- 5) 통신관리 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'통신관리 업무', 5);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'교환대 관리',   1, N'', 1),
    (@pid, 2, N'구내전화관리', 1, N'', 2);

    -- 6) 차량관리 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'차량관리 업무', 6);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'주차시설 및 차량관리', 0, N'', 1);

    -- 7) 전사 행사관리
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'전사 행사관리', 7);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'사외 행사 - 체육대회 등', 0, N'', 1);

    -- 8) 자재관련 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'자재관련 업무', 8);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'자재 입출고 관리(보호판, 철괴 등)', 0, N'', 1);

    -- 9) 사회 공헌 활동 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'사회 공헌 활동 업무', 9);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'외근(기관, 활동장소)', 0, N'', 1);

    -- 10) 민방위 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'민방위 업무', 10);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'민방위 비상소집훈련', 1, N'민방위기본법, 민방위비상소집훈련지침', 1),
    (@pid, 2, N'민방위 기본교육',    1, N'민방위기본법', 2);

    -- 11) 전사 보건업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'전사 보건업무', 11);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'사업장 순회점검',       0, N'산업안전보건법', 1),
    (@pid, 2, N'산업안전보건위원회의', 1, N'산업안전보건법', 2),
    (@pid, 3, N'전사 안전보건 교육',    1, N'산업안전보건법', 3),
    (@pid, 4, N'임직원 건강검진 관리',  1, N'산업안전보건법', 4);

    -- 12) 공사 계약 및 업체 관리
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'공사 계약 및 업체 관리', 12);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'입찰 및 계약 업무',            1, N'도시가스사업법, 안전관리규정, KGS Code,', 1),
    (@pid, 2, N'공사 시공업체 관리 및 평가집계', 0, N'산업안전보건법', 2);

    -- 13) 공급관 정산
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'공급관 정산', 13);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'배관 및 부대공사 정산업무', 1, N'산업안전보건법', 1);

    -- 14) 구내식당 운영 및 관리
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'구내식당 운영 및 관리', 14);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'식자재 준비', 0, N'식품위생법', 1),
    (@pid, 2, N'음식조리',     0, N'식품위생법', 2),
    (@pid, 3, N'식기세척',     0, N'식품위생법', 3),
    (@pid, 4, N'조리실 청소',  0, N'식품위생법', 4);

    -- 15) 비서 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'비서 업무', 15);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'외근(운전)', 0, N'', 1);

    -- 16) 기사 업무
    INSERT INTO tb_process_activity_process (form_id, major_category, middle_category, sub_category, sort_order)
    VALUES (@fid, N'A경영지원 부문', N'노경지원팀', N'기사 업무', 16);
    SET @pid = SCOPE_IDENTITY();
    INSERT INTO tb_process_activity_item (process_id, item_no, work_content, exclude_eval, applicable_law, sort_order) VALUES
    (@pid, 1, N'운전', 0, N'', 1);
END
GO
