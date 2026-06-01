package com.smartehs.mapper;

import com.smartehs.model.RadMeasurement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadMeasurementMapper {
    List<RadMeasurement> findAll();
    RadMeasurement findById(@Param("id") Long id);
    int countAll();
    int countByEvaluation(@Param("eval") String eval);
    void insert(RadMeasurement e);
    void update(RadMeasurement e);
    void softDelete(@Param("id") Long id);
}
