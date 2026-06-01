package com.smartehs.mapper;

import com.smartehs.model.DisasterFacility;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DisasterFacilityMapper {
    List<DisasterFacility> findAll();
    DisasterFacility findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countByFacType(@Param("facType") String facType);
    void insert(DisasterFacility e);
    void update(DisasterFacility e);
    void softDelete(@Param("id") Long id);
}
