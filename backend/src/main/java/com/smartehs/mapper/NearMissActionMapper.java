package com.smartehs.mapper;

import com.smartehs.model.NearMissAction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NearMissActionMapper {

    List<NearMissAction> findAll();

    NearMissAction findById(@Param("id") Long id);

    List<NearMissAction> findByNearMissId(@Param("nearMissId") String nearMissId);

    void insert(NearMissAction nearMissAction);

    void update(NearMissAction nearMissAction);

    void delete(@Param("id") Long id);

    void deleteByNearMissId(@Param("nearMissId") String nearMissId);
}
