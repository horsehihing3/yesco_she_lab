package com.smartehs.mapper;

import com.smartehs.model.WorkplaceSite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WorkplaceSiteMapper {
    List<WorkplaceSite> findAll();
    WorkplaceSite findById(@Param("id") Long id);
    String findMaxBuildingNumber();
    int insert(WorkplaceSite site);
    int update(WorkplaceSite site);
    int softDelete(@Param("id") Long id);
}
