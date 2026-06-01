package com.smartehs.mapper;

import com.smartehs.model.PartnerVisitor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PartnerVisitorMapper {
    List<PartnerVisitor> findAll();
    PartnerVisitor findById(@Param("id") Long id);
    int countToday();
    int countByStatus(@Param("status") String status);
    int countMonth();
    void insert(PartnerVisitor e);
    void update(PartnerVisitor e);
    void softDelete(@Param("id") Long id);
}
