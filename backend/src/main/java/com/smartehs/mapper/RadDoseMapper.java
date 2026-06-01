package com.smartehs.mapper;

import com.smartehs.model.RadDose;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadDoseMapper {
    List<RadDose> findAll();
    RadDose findById(@Param("id") Long id);
    int countAll();
    void insert(RadDose e);
    void update(RadDose e);
    void softDelete(@Param("id") Long id);
}
