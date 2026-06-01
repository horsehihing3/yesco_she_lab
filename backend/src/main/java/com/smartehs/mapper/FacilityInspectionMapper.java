package com.smartehs.mapper;

import com.smartehs.model.FacilityInspection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FacilityInspectionMapper {
    List<FacilityInspection> findAll();
    FacilityInspection findById(@Param("id") Long id);
    int countAll();
    int countByResult(@Param("result") String result);
    void insert(FacilityInspection e);
    void update(FacilityInspection e);
    void softDelete(@Param("id") Long id);
}
