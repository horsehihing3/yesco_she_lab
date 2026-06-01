package com.smartehs.mapper;

import com.smartehs.model.EmissionSource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmissionSourceMapper {

    List<EmissionSource> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    EmissionSource findById(@Param("id") Long id);

    List<EmissionSource> findBySourceNameContaining(@Param("sourceName") String sourceName, @Param("offset") int offset, @Param("limit") int limit);

    int countBySourceNameContaining(@Param("sourceName") String sourceName);

    List<EmissionSource> findAllActive();

    void insert(EmissionSource emissionSource);

    void update(EmissionSource emissionSource);

    void delete(@Param("id") Long id);
}
