package com.smartehs.mapper;

import com.smartehs.model.RadAccident;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadAccidentMapper {
    List<RadAccident> findAll();
    RadAccident findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countYear();
    void insert(RadAccident e);
    void update(RadAccident e);
    void softDelete(@Param("id") Long id);
}
