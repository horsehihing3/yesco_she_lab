package com.smartehs.mapper;

import com.smartehs.model.PsmHazop;
import com.smartehs.model.PsmHazopItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PsmHazopMapper {
    List<PsmHazop> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();
    PsmHazop findById(@Param("id") Long id);
    int countByHazopNoStartingWith(@Param("prefix") String prefix);
    void insert(PsmHazop h);
    void update(PsmHazop h);
    void softDelete(@Param("id") Long id);

    List<PsmHazopItem> findItemsByHazopId(@Param("hazopId") Long hazopId);
    void insertItem(PsmHazopItem item);
    void deleteItemsByHazopId(@Param("hazopId") Long hazopId);
}
