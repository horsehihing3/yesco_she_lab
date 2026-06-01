package com.smartehs.mapper;

import com.smartehs.model.FloorDrawing;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FloorDrawingMapper {

    List<FloorDrawing> findAll();

    List<FloorDrawing> findAllActive();

    List<FloorDrawing> findBySite(@Param("site") String site);

    FloorDrawing findById(@Param("id") Long id);

    List<FloorDrawing> findByWorkPlaceId(@Param("workPlaceId") Long workPlaceId);

    void insert(FloorDrawing floorDrawing);

    void update(FloorDrawing floorDrawing);

    void delete(@Param("id") Long id);

    void softDelete(@Param("id") Long id);
}
