package com.smartehs.mapper;

import com.smartehs.model.PpeInout;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeInoutMapper {
    List<PpeInout> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeInout> findByType(@Param("inoutType") String inoutType, @Param("offset") int offset, @Param("limit") int limit);
    int countByType(@Param("inoutType") String inoutType);
    List<PpeInout> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpeInout findById(@Param("id") Long id);
    List<PpeInout> findRecent(@Param("limit") int limit);
    void insert(PpeInout inout);
    void update(PpeInout inout);
    void softDelete(@Param("id") Long id);
    Integer sumQuantityThisMonth(@Param("inoutType") String inoutType);
}
