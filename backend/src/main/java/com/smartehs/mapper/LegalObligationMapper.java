package com.smartehs.mapper;

import com.smartehs.model.LegalObligation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalObligationMapper {
    List<LegalObligation> findAll();
    LegalObligation findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    int sumProgress();
    void insert(LegalObligation entity);
    void update(LegalObligation entity);
    void softDelete(@Param("id") Long id);
}
