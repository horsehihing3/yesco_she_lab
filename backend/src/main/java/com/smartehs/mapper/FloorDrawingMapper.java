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

    /** 사업장 이름 변경 시 도면 테이블의 name/site 컬럼 cascade rename */
    int renameSite(@Param("oldName") String oldName, @Param("newName") String newName);
}
