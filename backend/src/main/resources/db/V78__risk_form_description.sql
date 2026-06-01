-- V78: tb_risk_assessment_form에 description 컬럼 추가
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment_form') AND name = 'description')
BEGIN
    ALTER TABLE tb_risk_assessment_form ADD description NVARCHAR(MAX) NULL;
END;

-- 8개 양식에 기본 설명 채우기
EXEC sp_executesql N'
UPDATE tb_risk_assessment_form SET description = N''배관설계 및 도면 검토 업무 위험성 평가 양식'' WHERE title = N''배관설계연구(A)'';
UPDATE tb_risk_assessment_form SET description = N''시설물 점검·유지관리 업무 위험성 평가 양식'' WHERE title = N''시설물연구(B)'';
UPDATE tb_risk_assessment_form SET description = N''배관망 시뮬레이션 분석 업무 위험성 평가 양식'' WHERE title = N''배관망분석연구(C)'';
UPDATE tb_risk_assessment_form SET description = N''품질보증(QA) 검사 업무 위험성 평가 양식'' WHERE title = N''QA(품질보증)연구(D)'';
UPDATE tb_risk_assessment_form SET description = N''GIS 정보 수집·관리 업무 위험성 평가 양식'' WHERE title = N''GIS정보향상연구(E)'';
UPDATE tb_risk_assessment_form SET description = N''기술자료 작성 및 도면관리 업무 위험성 평가 양식'' WHERE title LIKE N''기술자료%'';
UPDATE tb_risk_assessment_form SET description = N''기타 일반 업무 위험성 평가 양식'' WHERE title = N''기타업무(I)'';
UPDATE tb_risk_assessment_form SET description = N''사무실 공통 업무 위험성 평가 양식'' WHERE title = N''사무공통(J)'';
';
