package com.smartehs.mapper;

import com.smartehs.model.OdAftercare;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdAftercareMapper {
    List<OdAftercare> findAll();
    OdAftercare findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countUrgent();
    void insert(OdAftercare e);
    void update(OdAftercare e);
    void softDelete(@Param("id") Long id);
}
