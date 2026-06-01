package com.smartehs.security;

import com.smartehs.model.IdmUser;
import com.smartehs.mapper.IdmMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final IdmMapper idmMapper;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        IdmUser user = idmMapper.findByUid(username);
        if (user == null || user.getPassword() == null || user.getPassword().isBlank()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        String role = user.getUserRole() != null ? user.getUserRole() : "TEAM_MEMBER";

        return new org.springframework.security.core.userdetails.User(
                user.getUid(),
                user.getPassword(),
                true,
                true,
                true,
                true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
