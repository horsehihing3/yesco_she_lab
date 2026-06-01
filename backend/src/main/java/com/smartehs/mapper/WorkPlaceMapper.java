package com.smartehs.mapper;

import com.smartehs.model.WorkPlace;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WorkPlaceMapper {

    List<WorkPlace> findAll();

    List<WorkPlace> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    WorkPlace findById(@Param("id") Long id);

    List<WorkPlace> findByUsedTrue();

    List<WorkPlace> findByUsedTrueWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countByUsedTrue();

    List<WorkPlace> findByPlaceContainingAndUsedTrue(@Param("place") String place, @Param("offset") int offset, @Param("limit") int limit);

    int countByPlaceContainingAndUsedTrue(@Param("place") String place);

    List<WorkPlace> findByFloorAndUsedTrue(@Param("floor") String floor, @Param("offset") int offset, @Param("limit") int limit);

    int countByFloorAndUsedTrue(@Param("floor") String floor);

    void insert(WorkPlace workPlace);

    void update(WorkPlace workPlace);

    void delete(@Param("id") Long id);
}
