package com.smartehs.mapper;

import com.smartehs.model.OSHCommittee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OSHCommitteeMapper {

    List<OSHCommittee> findAll();

    List<OSHCommittee> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    OSHCommittee findById(@Param("id") Long id);

    OSHCommittee findByOshId(@Param("oshId") String oshId);

    List<OSHCommittee> findByOshYear(@Param("oshYear") Integer oshYear, @Param("offset") int offset, @Param("limit") int limit);

    int countByOshYear(@Param("oshYear") Integer oshYear);

    List<OSHCommittee> findByOshYearAndOshQuarter(@Param("oshYear") Integer oshYear, @Param("oshQuarter") Integer oshQuarter, @Param("offset") int offset, @Param("limit") int limit);

    int countByOshYearAndOshQuarter(@Param("oshYear") Integer oshYear, @Param("oshQuarter") Integer oshQuarter);

    List<OSHCommittee> findByOshLocationContaining(@Param("oshLocation") String oshLocation, @Param("offset") int offset, @Param("limit") int limit);

    int countByOshLocationContaining(@Param("oshLocation") String oshLocation);

    void insert(OSHCommittee oshCommittee);

    void update(OSHCommittee oshCommittee);

    void delete(@Param("id") Long id);

    void updateAttendeeCount(@Param("oshId") String oshId, @Param("count") int count);
}
