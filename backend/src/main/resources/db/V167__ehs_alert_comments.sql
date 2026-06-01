-- V167: EHS 알림 댓글 (대댓글 지원)
--   self-referencing parent_id 로 1단계 답글 구조 지원.
--   삭제 시 cascade: 알림 삭제 → 댓글 전체 삭제 / 부모 댓글 삭제 → 답글 동시 삭제.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_ehs_alert_comment', 'U') IS NOT NULL DROP TABLE tb_ehs_alert_comment;
GO

CREATE TABLE tb_ehs_alert_comment (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    alert_id      BIGINT       NOT NULL,
    parent_id     BIGINT       NULL,                          -- NULL → 최상위 댓글, 값 있으면 대댓글
    content       NVARCHAR(2000) NOT NULL,
    author_name   NVARCHAR(50) NOT NULL,
    author_dept   NVARCHAR(100) NULL,
    author_email  NVARCHAR(150) NULL,
    deleted       BIT NOT NULL DEFAULT 0,
    created_at    DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at   DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_ehs_alert_comment_alert  ON tb_ehs_alert_comment (alert_id, deleted, parent_id, id);
CREATE INDEX IX_ehs_alert_comment_parent ON tb_ehs_alert_comment (parent_id);
GO

-- ===== 더미 데이터 =====
-- 첫 번째 알림(가장 오래된 알림)에 샘플 댓글·대댓글 시드
IF OBJECT_ID('tb_ehs_alert', 'U') IS NOT NULL
BEGIN
    DECLARE @aid1 BIGINT = (SELECT TOP 1 id FROM tb_ehs_alert ORDER BY id ASC);
    DECLARE @aid2 BIGINT = (SELECT id FROM tb_ehs_alert ORDER BY id ASC OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY);

    IF @aid1 IS NOT NULL
    BEGIN
        INSERT INTO tb_ehs_alert_comment (alert_id, parent_id, content, author_name, author_dept, author_email)
        VALUES (@aid1, NULL, N'확인했습니다. 부서 인원 전체 공유 완료했습니다.', N'이안전', N'안전관리팀', 'safety@com4in.com');

        DECLARE @cid1 BIGINT = SCOPE_IDENTITY();

        INSERT INTO tb_ehs_alert_comment (alert_id, parent_id, content, author_name, author_dept, author_email) VALUES
            (@aid1, @cid1, N'@이안전 공유 감사합니다. 점검 일정도 함께 안내 부탁드립니다.', N'박환경', N'환경팀',     'env@com4in.com'),
            (@aid1, @cid1, N'우리 팀도 오전 미팅에서 전달했습니다.',                       N'최보건', N'보건관리팀', 'health@com4in.com'),
            (@aid1, NULL, N'추가 자료가 있으면 첨부 부탁드립니다.',                       N'정총무', N'총무팀',     'admin@com4in.com');

        DECLARE @cid2 BIGINT = SCOPE_IDENTITY();

        INSERT INTO tb_ehs_alert_comment (alert_id, parent_id, content, author_name, author_dept, author_email) VALUES
            (@aid1, @cid2, N'추가 자료는 다음 주 월요일 업로드 예정입니다.', N'이안전', N'안전관리팀', 'safety@com4in.com');
    END

    IF @aid2 IS NOT NULL
    BEGIN
        INSERT INTO tb_ehs_alert_comment (alert_id, parent_id, content, author_name, author_dept, author_email) VALUES
            (@aid2, NULL, N'관련 부서 회람 완료했습니다.', N'김생산', N'생산팀', 'prod@com4in.com'),
            (@aid2, NULL, N'추가 조치 사항 있으면 회신 드립니다.', N'한정비', N'정비팀', 'maint@com4in.com');
    END
END
GO
