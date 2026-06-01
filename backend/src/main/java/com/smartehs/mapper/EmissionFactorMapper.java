package com.smartehs.mapper;

import com.smartehs.model.EmissionFactor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmissionFactorMapper {

    List<EmissionFactor> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    EmissionFactor findById(@Param("id") Long id);

    List<EmissionFactor> findByEnergySourceContaining(@Param("energySource") String energySource, @Param("offset") int offset, @Param("limit") int limit);

    int countByEnergySourceContaining(@Param("energySource") String energySource);

    List<EmissionFactor> findAllList();

    void insert(EmissionFactor emissionFactor);

    void update(EmissionFactor emissionFactor);

    void delete(@Param("id") Long id);
}
