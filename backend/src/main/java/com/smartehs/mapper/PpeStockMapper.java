package com.smartehs.mapper;

import com.smartehs.model.PpeStock;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeStockMapper {
    List<PpeStock> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeStock> findByLocation(@Param("location") String location, @Param("offset") int offset, @Param("limit") int limit);
    int countByLocation(@Param("location") String location);
    List<PpeStock> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpeStock findById(@Param("id") Long id);
    List<PpeStock> findLowStock();
    List<PpeStock> findExpiringSoon(@Param("days") int days);
    void insert(PpeStock stock);
    void update(PpeStock stock);
    void softDelete(@Param("id") Long id);
    Integer sumQuantity();
    int countLowStock();
    int countExpiringSoon(@Param("days") int days);
}
