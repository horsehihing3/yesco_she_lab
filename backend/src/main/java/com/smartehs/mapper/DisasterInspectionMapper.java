package com.smartehs.mapper;

import com.smartehs.model.DisasterInspection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DisasterInspectionMapper {
    List<DisasterInspection> findAll();
    DisasterInspection findById(@Param("id") Long id);
    int countAll();
    void insert(DisasterInspection e);
    void update(DisasterInspection e);
    void softDelete(@Param("id") Long id);
}
