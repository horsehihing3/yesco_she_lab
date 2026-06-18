package com.smartehs.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * HR 인터페이스 수신 결과 묶음 = ES_RETURN(성공여부) + 데이터 리스트.
 * 적재 전에 반드시 {@link #isSuccess()}로 성공을 확인한다.
 * 실패(MSGTY='E')면 절대 빈/부분 데이터로 기존 데이터를 덮어쓰지 않는다.
 */
@Data
@AllArgsConstructor
public class HrFetchResult<T> {

    private EsReturn esReturn;
    private List<T> items;

    public boolean isSuccess() {
        return esReturn != null && esReturn.isSuccess();
    }

    public String message() {
        return esReturn != null ? esReturn.getMsglin() : null;
    }

    public int size() {
        return items != null ? items.size() : 0;
    }
}
