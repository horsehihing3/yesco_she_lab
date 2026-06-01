package com.smartehs.mapper;

import com.smartehs.model.DpThermal;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpThermalMapper {
    List<DpThermal> findAll();
    DpThermal findById(@Param("id") Long id);
    int countAll();
    int countByType(@Param("thermalType") String thermalType);
    int countBySeverity(@Param("severity") String severity);
    void insert(DpThermal e);
    void update(DpThermal e);
    void softDelete(@Param("id") Long id);
}
