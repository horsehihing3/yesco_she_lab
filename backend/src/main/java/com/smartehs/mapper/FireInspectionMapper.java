package com.smartehs.mapper;

import com.smartehs.model.FireInspection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireInspectionMapper {
    List<FireInspection> findAll();
    FireInspection findById(@Param("id") Long id);
    int countAll();
    int countByResult(@Param("result") String result);
    void insert(FireInspection e);
    void update(FireInspection e);
    void softDelete(@Param("id") Long id);
}
