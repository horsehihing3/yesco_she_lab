package com.smartehs.mapper;

import com.smartehs.model.WaterSamplingPoint;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WaterSamplingPointMapper {

    List<WaterSamplingPoint> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    WaterSamplingPoint findById(@Param("id") Long id);

    List<WaterSamplingPoint> findByNameContaining(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);

    int countByNameContaining(@Param("keyword") String keyword);

    List<WaterSamplingPoint> findByWorkplaceId(@Param("workplaceId") Long workplaceId);

    void insert(WaterSamplingPoint waterSamplingPoint);

    void update(WaterSamplingPoint waterSamplingPoint);

    void delete(@Param("id") Long id);
}
