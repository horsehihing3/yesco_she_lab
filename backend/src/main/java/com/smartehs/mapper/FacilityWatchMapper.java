package com.smartehs.mapper;

import com.smartehs.model.FacilityWatch;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FacilityWatchMapper {
    List<FacilityWatch> findAll();
    FacilityWatch findById(@Param("id") Long id);
    int countAll();
    int countByRiskGrade(@Param("risk") String risk);
    void insert(FacilityWatch e);
    void update(FacilityWatch e);
    void softDelete(@Param("id") Long id);
}
