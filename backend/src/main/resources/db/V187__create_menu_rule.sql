-- V187: 메뉴 노출 규칙 관리 테이블 (저장 = 숨김 규칙)
CREATE TABLE tb_menu_rule (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    role_key    NVARCHAR(50)  NOT NULL,
    menu_key    NVARCHAR(100) NOT NULL,
    created_at  DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_menu_rule UNIQUE (role_key, menu_key)
);
