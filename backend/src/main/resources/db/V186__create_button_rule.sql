-- V186: 버튼 노출 규칙 관리 테이블
CREATE TABLE tb_button_rule (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    menu_path    NVARCHAR(200) NOT NULL,
    status_code  NVARCHAR(100) NOT NULL,
    button_name  NVARCHAR(100) NOT NULL,
    role_key     NVARCHAR(50)  NOT NULL,
    visible      BIT           NOT NULL,
    created_at   DATETIME2     DEFAULT GETDATE(),
    modified_at  DATETIME2     DEFAULT GETDATE(),
    CONSTRAINT UQ_button_rule UNIQUE (menu_path, status_code, button_name, role_key)
);
