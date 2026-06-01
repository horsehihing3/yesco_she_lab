package com.smartehs.mapper;

import com.smartehs.model.HazardFactor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HazardFactorMapper {
    List<HazardFactor> findAllByType(@Param("hazardType") String hazardType, @Param("offset") int offset, @Param("limit") int limit);
    int countByType(@Param("hazardType") String hazardType);
    HazardFactor findById(@Param("id") Long id);
    List<HazardFactor> findByTypeAndRiskLevel(@Param("hazardType") String hazardType, @Param("riskLevel") String riskLevel, @Param("offset") int offset, @Param("limit") int limit);
    int countByTypeAndRiskLevel(@Param("hazardType") String hazardType, @Param("riskLevel") String riskLevel);
    List<HazardFactor> searchByName(@Param("hazardType") String hazardType, @Param("name") String name, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearchName(@Param("hazardType") String hazardType, @Param("name") String name);
    void insert(HazardFactor hazardFactor);
    void update(HazardFactor hazardFactor);
    void delete(@Param("id") Long id);
}
