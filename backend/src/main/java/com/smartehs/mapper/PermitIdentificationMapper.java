package com.smartehs.mapper;

import com.smartehs.model.PermitIdentification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitIdentificationMapper {
    List<PermitIdentification> findAll();
    PermitIdentification findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    void insert(PermitIdentification e);
    void update(PermitIdentification e);
    void softDelete(@Param("id") Long id);
}
