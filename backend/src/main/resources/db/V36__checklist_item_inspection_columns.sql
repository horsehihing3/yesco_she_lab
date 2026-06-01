-- V36: 체크리스트 항목에 분류(필수/선택), 점검결과, 지적사항, 조치기한, 조치완료 컬럼 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_item' AND COLUMN_NAME='classification')
    ALTER TABLE tb_checklist_item ADD classification NVARCHAR(10) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_item' AND COLUMN_NAME='check_result')
    ALTER TABLE tb_checklist_item ADD check_result NVARCHAR(10) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_item' AND COLUMN_NAME='finding')
    ALTER TABLE tb_checklist_item ADD finding NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_item' AND COLUMN_NAME='action_deadline')
    ALTER TABLE tb_checklist_item ADD action_deadline NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_item' AND COLUMN_NAME='action_complete')
    ALTER TABLE tb_checklist_item ADD action_complete BIT DEFAULT 0;

-- 기존 산업안전보건법 체크리스트 더미데이터 업데이트 (classification 세팅)
EXEC('
DECLARE @tplId BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name LIKE N''%산업안전보건법%'' AND is_active=1);
IF @tplId IS NOT NULL BEGIN
  -- 기존 데이터 삭제 (FK 순서: result → item → category)
  DELETE FROM tb_checklist_inspection_result WHERE item_id IN (SELECT i.id FROM tb_checklist_item i JOIN tb_checklist_category c ON i.category_id = c.id WHERE c.template_id = @tplId);
  DELETE FROM tb_checklist_item WHERE category_id IN (SELECT id FROM tb_checklist_category WHERE template_id = @tplId);
  DELETE FROM tb_checklist_category WHERE template_id = @tplId;

  -- 안전관리
  DECLARE @cat1 BIGINT;
  INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@tplId, N''안전관리'', 1);
  SET @cat1 = SCOPE_IDENTITY();
  INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
  (@cat1, 1, N''필수'', N''작업장 정리정돈 및 통로 확보'', N''산안법 §38'', 1),
  (@cat1, 2, N''필수'', N''안전표지 부착 및 식별 용이성'', N''산안법 §37'', 2),
  (@cat1, 3, N''필수'', N''안전보호구 지급 및 착용 상태'', N''산안법 §38'', 3),
  (@cat1, 4, N''필수'', N''위험구역 접근방지 조치 (방호울, 경고선)'', N''안전기준 §31'', 4),
  (@cat1, 5, N''필수'', N''기계·설비 방호장치 정상 작동 여부'', N''산안법 §80'', 5),
  (@cat1, 6, N''선택'', N''전기설비 안전상태 (누전차단기, 접지)'', N''전기안전기준'', 6),
  (@cat1, 7, N''필수'', N''화재예방 조치 (소화기 위치·유효기간)'', N''소방기본법'', 7),
  (@cat1, 8, N''필수'', N''비상구 및 피난통로 장애물 없음'', N''건축법 §49'', 8);

  -- 보건관리
  DECLARE @cat2 BIGINT;
  INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@tplId, N''보건관리'', 2);
  SET @cat2 = SCOPE_IDENTITY();
  INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
  (@cat2, 9, N''필수'', N''유해인자 측정 및 관리 기록 비치'', N''산안법 §125'', 1),
  (@cat2, 10, N''필수'', N''물질안전보건자료(MSDS) 게시 여부'', N''산안법 §114'', 2),
  (@cat2, 11, N''선택'', N''국소배기장치 정상 가동 여부'', N''안전보건기준 §429'', 3),
  (@cat2, 12, N''필수'', N''보건용 보호구(방독마스크 등) 비치'', N''산안법 §38'', 4),
  (@cat2, 13, N''선택'', N''세면·세척시설 청결 유지'', N''산안법 §128'', 5),
  (@cat2, 14, N''선택'', N''산업보건의 순회점검 실시 여부'', N''산안법 §22'', 6);

  -- 화학물질 관리
  DECLARE @cat3 BIGINT;
  INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@tplId, N''화학물질 관리'', 3);
  SET @cat3 = SCOPE_IDENTITY();
  INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
  (@cat3, 15, N''필수'', N''화학물질 표시(경고표지) 부착'', N''화관법 §16'', 1),
  (@cat3, 16, N''필수'', N''화학물질 보관 용기 밀폐 및 정리'', N''화관법 §13'', 2),
  (@cat3, 17, N''필수'', N''화학물질 취급대장 기록·유지'', N''화관법 §15'', 3),
  (@cat3, 18, N''필수'', N''폐액·폐기물 분리보관 및 라벨 부착'', N''폐기물관리법'', 4);

  -- 설비·기계 안전
  DECLARE @cat4 BIGINT;
  INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@tplId, N''설비·기계 안전'', 4);
  SET @cat4 = SCOPE_IDENTITY();
  INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
  (@cat4, 19, N''선택'', N''크레인·호이스트 점검기록 비치'', N''산안법 §93'', 1),
  (@cat4, 20, N''선택'', N''프레스·전단기 안전장치 작동 확인'', N''안전기준 §97'', 2),
  (@cat4, 21, N''선택'', N''배관·밸브 색상 표시 및 흐름 방향 표시'', N''KS B 0109'', 3),
  (@cat4, 22, N''선택'', N''작업허가서(PTW) 발행 및 관리'', N''안전보건기준 §2'', 4);

  -- 비상대응
  DECLARE @cat5 BIGINT;
  INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (@tplId, N''비상대응'', 5);
  SET @cat5 = SCOPE_IDENTITY();
  INSERT INTO tb_checklist_item (category_id, item_no, classification, check_item, legal_basis, sort_order) VALUES
  (@cat5, 23, N''필수'', N''비상연락망 게시 및 최신화 여부'', N''산안법 §26'', 1),
  (@cat5, 24, N''필수'', N''비상대피도 게시 및 식별 가능'', N''소방기본법'', 2),
  (@cat5, 25, N''선택'', N''비상샤워·세안기 정상 작동 여부'', N''ANSI Z358.1'', 3),
  (@cat5, 26, N''필수'', N''응급처치함 구비 및 약품 유효기간 확인'', N''산안법 §43'', 4);
END
');
