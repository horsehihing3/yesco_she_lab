-- V60: 작업 허가 보호구 데이터를 보호구 재고 이름에 맞게 수정
UPDATE tb_permit_to_work SET required_ppe = N'안전모 (ABS), 안전화 (경량), 내화학성 장갑' WHERE permit_id = 'PTW-2026-001';
UPDATE tb_permit_to_work SET required_ppe = N'공기호흡기 (SCBA), 안전대 (전신식), 안전모 (ABS), 가스감지기 (4종)' WHERE permit_id = 'PTW-2026-002';
UPDATE tb_permit_to_work SET required_ppe = N'안전대 (전신식), 안전모 (ABS), 안전화 (경량)' WHERE permit_id = 'PTW-2026-003';
UPDATE tb_permit_to_work SET required_ppe = N'안전모 (ABS), 안전화 (경량), 내화학성 장갑' WHERE permit_id = 'PTW-2026-004';
UPDATE tb_permit_to_work SET required_ppe = N'안전모 (ABS), 안전화 (경량)' WHERE permit_id = 'PTW-2026-005';
UPDATE tb_permit_to_work SET required_ppe = N'안전모 (ABS), 안전화 (경량), 안전대 (전신식)' WHERE permit_id = 'PTW-2026-006';
UPDATE tb_permit_to_work SET required_ppe = N'안전모 (ABS), 안전화 (경량), 내화학성 장갑' WHERE permit_id = 'PTW-2026-007';
UPDATE tb_permit_to_work SET required_ppe = N'공기호흡기 (SCBA), 방독 마스크 (전면), 보호복 (화학용), 안전대 (전신식)' WHERE permit_id = 'PTW-2026-008';
