package com.smartehs.mapper;

import com.smartehs.model.FireDrill;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireDrillMapper {
    List<FireDrill> findAll();
    FireDrill findById(@Param("id") Long id);
    int countAll();
    int countYear();
    void insert(FireDrill e);
    void update(FireDrill e);
    void softDelete(@Param("id") Long id);
}
