package com.smartehs.mapper;

import com.smartehs.model.Msds;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MsdsMapper {

    List<Msds> findByTypeAndLatest(@Param("msdsType") String msdsType,
                                   @Param("isLatest") Boolean isLatest,
                                   @Param("offset") int offset,
                                   @Param("limit") int limit);
    int countByTypeAndLatest(@Param("msdsType") String msdsType,
                             @Param("isLatest") Boolean isLatest);

    Msds findById(@Param("id") Long id);

    List<Msds> search(@Param("msdsType") String msdsType,
                      @Param("keyword") String keyword,
                      @Param("isLatest") Boolean isLatest,
                      @Param("offset") int offset,
                      @Param("limit") int limit);
    int countSearch(@Param("msdsType") String msdsType,
                    @Param("keyword") String keyword,
                    @Param("isLatest") Boolean isLatest);

    void insert(Msds msds);
    void update(Msds msds);
    void softDelete(@Param("id") Long id);
}
