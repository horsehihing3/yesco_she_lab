-- V141: 개선실행(Improvement Plan) 모듈 제거
-- (위험성 평가 페이지의 "개선실행" 탭 및 관련 백엔드/프론트엔드 일괄 삭제에 따라 테이블 제거)

IF OBJECT_ID('tb_improvement_plan_item', 'U') IS NOT NULL
    DROP TABLE tb_improvement_plan_item;
GO

IF OBJECT_ID('tb_improvement_plan', 'U') IS NOT NULL
    DROP TABLE tb_improvement_plan;
GO
