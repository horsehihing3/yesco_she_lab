package com.smartehs.mapper;

import com.smartehs.model.OdmExposure;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdmExposureMapper {
    List<OdmExposure> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<OdmExposure> findByRiskLevel(@Param("riskLevel") String riskLevel, @Param("offset") int offset, @Param("limit") int limit);
    int countByRiskLevel(@Param("riskLevel") String riskLevel);
    OdmExposure findById(@Param("id") Long id);
    void insert(OdmExposure exposure);
    void update(OdmExposure exposure);
    void delete(@Param("id") Long id);
}
