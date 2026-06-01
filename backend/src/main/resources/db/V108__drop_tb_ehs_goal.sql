-- V108: 목표 관리 기능 제거에 따른 tb_ehs_goal 테이블 삭제
-- (V26에서 생성된 미사용 테이블 정리)

IF OBJECT_ID('tb_ehs_goal', 'U') IS NOT NULL
    DROP TABLE tb_ehs_goal;
