package com.smartehs.mapper;

import com.smartehs.model.ChecklistTemplateItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChecklistTemplateItemMapper {
    List<ChecklistTemplateItem> findByMasterId(@Param("masterId") Long masterId);
    void insert(ChecklistTemplateItem item);
    void deleteByMasterId(@Param("masterId") Long masterId);
}
