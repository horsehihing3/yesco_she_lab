package com.smartehs.mapper;

import com.smartehs.model.EvalSheetItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface EvalSheetItemMapper {
    List<EvalSheetItem> findAll();
    EvalSheetItem findById(@Param("id") Long id);
    int updateScore(@Param("id") Long id, @Param("score") BigDecimal score);
    void insert(EvalSheetItem item);
    int update(EvalSheetItem item);
    int delete(@Param("id") Long id);
    int nextSortOrder();
}
