package com.smartehs.mapper;

import com.smartehs.model.AirEmissionStandard;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AirEmissionStandardMapper {

    List<AirEmissionStandard> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    List<AirEmissionStandard> findAllList();

    AirEmissionStandard findById(@Param("id") Long id);

    void insert(AirEmissionStandard airEmissionStandard);

    void update(AirEmissionStandard airEmissionStandard);

    void delete(@Param("id") Long id);
}
