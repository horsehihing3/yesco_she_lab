package com.smartehs.mapper;

import com.smartehs.model.PermitRegistry;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitRegistryMapper {
    List<PermitRegistry> findAll();
    PermitRegistry findById(@Param("id") Long id);
    int countAll();
    int countByCategory(@Param("category") String category);
    int countExpired();
    int countExpiringWithin(@Param("days") int days);
    int countValid();
    void insert(PermitRegistry e);
    void update(PermitRegistry e);
    void softDelete(@Param("id") Long id);
}
