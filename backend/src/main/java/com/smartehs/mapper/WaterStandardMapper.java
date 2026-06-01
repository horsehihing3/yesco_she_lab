package com.smartehs.mapper;

import com.smartehs.model.WaterStandard;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WaterStandardMapper {

    List<WaterStandard> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    List<WaterStandard> findAll();

    WaterStandard findById(@Param("id") Long id);

    List<WaterStandard> findByNameContaining(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);

    int countByNameContaining(@Param("keyword") String keyword);

    void insert(WaterStandard waterStandard);

    void update(WaterStandard waterStandard);

    void delete(@Param("id") Long id);
}
