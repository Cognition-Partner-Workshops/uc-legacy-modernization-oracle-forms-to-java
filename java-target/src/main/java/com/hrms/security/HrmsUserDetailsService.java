package com.hrms.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom UserDetailsService implementation.
 *
 * Replaces: PKG_SECURITY.authenticate() user lookup logic.
 * Loads user details from the APP_USERS table for Spring Security authentication.
 */
@Service
public class HrmsUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public HrmsUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + username));
        return new HrmsUserDetails(user);
    }
}
