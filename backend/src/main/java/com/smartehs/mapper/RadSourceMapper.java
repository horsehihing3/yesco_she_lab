package com.smartehs.mapper;

import com.smartehs.model.RadSource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadSourceMapper {
    List<RadSource> findAll();
    RadSource findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countByExpireWithinDays(@Param("days") int days);
    void insert(RadSource e);
    void update(RadSource e);
    void softDelete(@Param("id") Long id);
}
