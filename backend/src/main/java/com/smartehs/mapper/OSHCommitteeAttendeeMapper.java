package com.smartehs.mapper;

import com.smartehs.model.OSHCommitteeAttendee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OSHCommitteeAttendeeMapper {

    List<OSHCommitteeAttendee> findAll();

    OSHCommitteeAttendee findById(@Param("id") Long id);

    List<OSHCommitteeAttendee> findByOshId(@Param("oshId") String oshId);

    OSHCommitteeAttendee findByOshIdAndAttendeeMail(@Param("oshId") String oshId, @Param("attendeeMail") String attendeeMail);

    int countByOshId(@Param("oshId") String oshId);

    void insert(OSHCommitteeAttendee attendee);

    void update(OSHCommitteeAttendee attendee);

    void delete(@Param("id") Long id);

    void deleteByOshId(@Param("oshId") String oshId);
}
