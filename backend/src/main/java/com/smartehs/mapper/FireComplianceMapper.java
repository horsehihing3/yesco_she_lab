package com.smartehs.mapper;

import com.smartehs.model.FireCompliance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireComplianceMapper {
    List<FireCompliance> findAll();
    FireCompliance findById(@Param("id") Long id);
    int countAll();
    void insert(FireCompliance e);
    void update(FireCompliance e);
    void softDelete(@Param("id") Long id);
}
