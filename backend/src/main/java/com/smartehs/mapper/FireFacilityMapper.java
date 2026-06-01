package com.smartehs.mapper;

import com.smartehs.model.FireFacility;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireFacilityMapper {
    List<FireFacility> findAll();
    FireFacility findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countByCategory(@Param("category") String category);
    void insert(FireFacility e);
    void update(FireFacility e);
    void softDelete(@Param("id") Long id);
}
