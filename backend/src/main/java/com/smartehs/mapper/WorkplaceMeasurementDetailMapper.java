package com.smartehs.mapper;

import com.smartehs.model.WorkplaceMeasurementDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WorkplaceMeasurementDetailMapper {

    List<WorkplaceMeasurementDetail> findByMeasurementId(@Param("measurementId") String measurementId);
    WorkplaceMeasurementDetail findById(@Param("id") Long id);

    void insert(WorkplaceMeasurementDetail detail);
    void deleteByMeasurementId(@Param("measurementId") String measurementId);
}
