package com.smartehs.mapper;

import com.smartehs.model.WemFactor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WemFactorMapper {
    List<WemFactor> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<WemFactor> findByFactorType(@Param("factorType") String factorType, @Param("offset") int offset, @Param("limit") int limit);
    int countByFactorType(@Param("factorType") String factorType);
    List<WemFactor> searchByName(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countByName(@Param("keyword") String keyword);
    WemFactor findById(@Param("id") Long id);
    void insert(WemFactor factor);
    void update(WemFactor factor);
    void delete(@Param("id") Long id);
}
