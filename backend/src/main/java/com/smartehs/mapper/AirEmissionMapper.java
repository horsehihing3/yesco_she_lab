package com.smartehs.mapper;

import com.smartehs.model.AirEmission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AirEmissionMapper {

    List<AirEmission> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    List<AirEmission> findAllList();

    AirEmission findById(@Param("id") Long id);

    List<AirEmission> findByFacilityContaining(@Param("facility") String facility, @Param("offset") int offset, @Param("limit") int limit);

    int countByFacilityContaining(@Param("facility") String facility);

    void insert(AirEmission airEmission);

    void update(AirEmission airEmission);

    void delete(@Param("id") Long id);
}
