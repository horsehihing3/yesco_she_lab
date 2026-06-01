package com.smartehs.mapper;

import com.smartehs.model.PermitChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitChangeMapper {
    List<PermitChange> findAll();
    PermitChange findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    void insert(PermitChange e);
    void update(PermitChange e);
    void softDelete(@Param("id") Long id);
}
