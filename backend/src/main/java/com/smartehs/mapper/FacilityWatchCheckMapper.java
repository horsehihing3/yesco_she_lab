package com.smartehs.mapper;

import com.smartehs.model.FacilityWatchCheck;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FacilityWatchCheckMapper {
    List<FacilityWatchCheck> findAll();
    FacilityWatchCheck findById(@Param("id") Long id);
    void insert(FacilityWatchCheck e);
    void update(FacilityWatchCheck e);
    void softDelete(@Param("id") Long id);
}
