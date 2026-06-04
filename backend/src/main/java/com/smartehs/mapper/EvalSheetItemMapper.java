package com.smartehs.mapper;

import com.smartehs.model.EvalSheetItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface EvalSheetItemMapper {
    /** 모든 평가표의 항목 (구버전 호환) */
    List<EvalSheetItem> findAll();
    /** 특정 평가표의 항목만 */
    List<EvalSheetItem> findByMetaId(@Param("metaId") Long metaId);
    EvalSheetItem findById(@Param("id") Long id);
    int updateScore(@Param("id") Long id, @Param("score") BigDecimal score);
    void insert(EvalSheetItem item);
    int update(EvalSheetItem item);
    int delete(@Param("id") Long id);
    int deleteByMetaId(@Param("metaId") Long metaId);
    int nextSortOrder(@Param("metaId") Long metaId);
}
