package com.smartehs.mapper;

import com.smartehs.model.RadDrill;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadDrillMapper {
    List<RadDrill> findAll();
    RadDrill findById(@Param("id") Long id);
    int countAll();
    void insert(RadDrill e);
    void update(RadDrill e);
    void softDelete(@Param("id") Long id);
}
