package com.smartehs.mapper;

import com.smartehs.model.LegalPermit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalPermitMapper {
    List<LegalPermit> findAll();
    LegalPermit findById(@Param("id") Long id);
    int countAll();
    int countByExpireWithinDays(@Param("days") int days);
    void insert(LegalPermit entity);
    void update(LegalPermit entity);
    void softDelete(@Param("id") Long id);
}
