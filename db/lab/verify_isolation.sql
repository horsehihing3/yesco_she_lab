/* ============================================================================
   Lab DB 격리 검증
   원본(읽기전용): SmartEHS_com4in   /   복제본(lab): yescoSHE_lab
   ----------------------------------------------------------------------------
   ⚠ 원본 SmartEHS_com4in 은 이 스크립트에서 '읽기(SELECT/메타데이터)'만 한다.
     쓰기(CREATE/INSERT/UPDATE/DELETE)는 전부 yescoSHE_lab 에만 일어난다.
   목적: 두 DB가 물리/논리적으로 완전히 분리됐고, lab 변경이 원본에 영향 0 임을 증명.
   실행: master 컨텍스트에서 전체 실행(F5). 세 파트 결과를 차례로 확인.
   ============================================================================ */
USE [master];
SET NOCOUNT ON;
GO

PRINT N'================ [PART A] 물리/논리 분리 ================';
-- 서로 다른 database_id, 서로 다른 물리파일(.mdf/.ldf) 경로여야 함
SELECT name, database_id, state_desc, create_date
FROM sys.databases
WHERE name IN (N'SmartEHS_com4in', N'yescoSHE_lab')
ORDER BY name;

SELECT DB_NAME(database_id) AS db, name AS logical_file, type_desc, physical_name
FROM sys.master_files
WHERE database_id IN (DB_ID(N'SmartEHS_com4in'), DB_ID(N'yescoSHE_lab'))
ORDER BY db, type_desc;
GO

PRINT N'================ [PART B] 테이블별 행수 패리티(복제 직후 동일해야 함) ================';
-- 메타데이터(sys.partitions)만 읽음 → 원본 데이터 스캔/쓰기 없음
IF OBJECT_ID('tempdb..#src') IS NOT NULL DROP TABLE #src;
IF OBJECT_ID('tempdb..#lab') IS NOT NULL DROP TABLE #lab;

SELECT t.name COLLATE DATABASE_DEFAULT AS tbl, SUM(p.rows) AS rows_src
INTO #src
FROM SmartEHS_com4in.sys.partitions p
JOIN SmartEHS_com4in.sys.tables t ON t.object_id = p.object_id
WHERE p.index_id IN (0,1) AND t.is_ms_shipped = 0
GROUP BY t.name;

SELECT t.name COLLATE DATABASE_DEFAULT AS tbl, SUM(p.rows) AS rows_lab
INTO #lab
FROM yescoSHE_lab.sys.partitions p
JOIN yescoSHE_lab.sys.tables t ON t.object_id = p.object_id
WHERE p.index_id IN (0,1) AND t.is_ms_shipped = 0
GROUP BY t.name;

-- 요약: 테이블 수 / 총행수 / 불일치 건수
SELECT
    (SELECT COUNT(*) FROM #src) AS src_tables,
    (SELECT COUNT(*) FROM #lab) AS lab_tables,
    (SELECT SUM(rows_src) FROM #src) AS src_total_rows,
    (SELECT SUM(rows_lab) FROM #lab) AS lab_total_rows,
    (SELECT COUNT(*) FROM #src s FULL JOIN #lab l ON s.tbl = l.tbl
        WHERE ISNULL(s.rows_src,-1) <> ISNULL(l.rows_lab,-1)) AS mismatched_tables;

-- 불일치가 있으면 상위 20건 표시(복제 직후엔 0건이 정상)
SELECT TOP 20 ISNULL(s.tbl,l.tbl) AS tbl, s.rows_src, l.rows_lab
FROM #src s FULL JOIN #lab l ON s.tbl = l.tbl
WHERE ISNULL(s.rows_src,-1) <> ISNULL(l.rows_lab,-1)
ORDER BY tbl;
GO

PRINT N'================ [PART C] 쓰기 격리 증명 (lab 변경 → 원본 불변) ================';
/* C1. 원본의 마커테이블 존재여부 사전확인(읽기) — 없어야 정상 */
SELECT N'before: src_has_marker' AS step,
       CASE WHEN OBJECT_ID(N'SmartEHS_com4in.dbo._lab_isolation_check') IS NULL
            THEN N'NO (정상)' ELSE N'YES (이상!)' END AS result;
GO

/* C2. yescoSHE_lab 에만 마커테이블 생성 + 1건 INSERT (쓰기는 lab 한정) */
USE [yescoSHE_lab];
GO
IF OBJECT_ID(N'dbo._lab_isolation_check') IS NOT NULL DROP TABLE dbo._lab_isolation_check;
CREATE TABLE dbo._lab_isolation_check (id int IDENTITY(1,1) PRIMARY KEY, note nvarchar(100), created_at datetime2 DEFAULT SYSDATETIME());
INSERT INTO dbo._lab_isolation_check (note) VALUES (N'isolation test row - lab only');
SELECT N'lab: marker_rows' AS step, COUNT(*) AS cnt FROM dbo._lab_isolation_check;
GO

/* C3. 원본은 그대로인지 재확인(읽기) — 여전히 마커테이블 없어야 함 */
USE [master];
GO
SELECT N'after: src_has_marker' AS step,
       CASE WHEN OBJECT_ID(N'SmartEHS_com4in.dbo._lab_isolation_check') IS NULL
            THEN N'NO (원본 불변 ✔)' ELSE N'YES (원본 오염 ✗)' END AS result;

/* C4. 동일 실제 테이블의 원본 행수가 변하지 않았는지 대조(읽기) — lab 활동이 원본에 안 샘 */
SELECT N'src_total_rows(recheck)' AS step, SUM(p.rows) AS rows_src
FROM SmartEHS_com4in.sys.partitions p
JOIN SmartEHS_com4in.sys.tables t ON t.object_id = p.object_id
WHERE p.index_id IN (0,1) AND t.is_ms_shipped = 0;
GO

/* C5. 정리: lab 의 마커테이블 제거(원본 무관) */
USE [yescoSHE_lab];
GO
IF OBJECT_ID(N'dbo._lab_isolation_check') IS NOT NULL DROP TABLE dbo._lab_isolation_check;
USE [master];
GO
PRINT N'=== 격리 검증 종료 ===';
GO
