package com.smartehs.mapper;

import com.smartehs.model.ChecklistResultItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChecklistResultItemMapper {
    List<ChecklistResultItem> findByMasterId(@Param("masterId") Long masterId);
    void insert(ChecklistResultItem item);
    void deleteByMasterId(@Param("masterId") Long masterId);
}
