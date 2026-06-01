package com.smartehs.mapper;

import com.smartehs.model.WaterQuality;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WaterQualityMapper {

    List<WaterQuality> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    WaterQuality findById(@Param("id") Long id);

    List<WaterQuality> findByMeasurementPointContaining(@Param("measurementPoint") String measurementPoint, @Param("offset") int offset, @Param("limit") int limit);

    int countByMeasurementPointContaining(@Param("measurementPoint") String measurementPoint);

    void insert(WaterQuality waterQuality);

    void update(WaterQuality waterQuality);

    void delete(@Param("id") Long id);
}
