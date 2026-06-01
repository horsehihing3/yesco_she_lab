package com.smartehs.mapper;

import com.smartehs.model.FacilityEquipment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FacilityEquipmentMapper {
    List<FacilityEquipment> findAll();
    FacilityEquipment findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countByExpireWithinDays(@Param("days") int days);
    void insert(FacilityEquipment e);
    void update(FacilityEquipment e);
    void softDelete(@Param("id") Long id);
}
