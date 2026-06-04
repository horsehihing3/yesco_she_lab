package com.smartehs.mapper;

import com.smartehs.model.EvalSheetMeta;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EvalSheetMetaMapper {
    EvalSheetMeta findFirst();
    /** 최신 생성 우선 정렬 */
    List<EvalSheetMeta> findAll();
    EvalSheetMeta findById(@Param("id") Long id);
    int update(EvalSheetMeta meta);
    void insert(EvalSheetMeta meta);
    int delete(@Param("id") Long id);
}
