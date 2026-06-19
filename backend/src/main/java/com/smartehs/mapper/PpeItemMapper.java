package com.smartehs.mapper;

import com.smartehs.model.PpeItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeItemMapper {
    List<PpeItem> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeItem> findByCategory(@Param("category") String category, @Param("offset") int offset, @Param("limit") int limit);
    int countByCategory(@Param("category") String category);
    List<PpeItem> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpeItem findById(@Param("id") Long id);
    void insert(PpeItem item);
    void update(PpeItem item);
    void softDelete(@Param("id") Long id);
    int countDistinctCategory();
    int countDistinctSupplier();
}
