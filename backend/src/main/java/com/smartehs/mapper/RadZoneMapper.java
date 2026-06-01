package com.smartehs.mapper;

import com.smartehs.model.RadZone;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadZoneMapper {
    List<RadZone> findAll();
    RadZone findById(@Param("id") Long id);
    int countByType(@Param("type") String type);
    void insert(RadZone e);
    void update(RadZone e);
    void softDelete(@Param("id") Long id);
}
