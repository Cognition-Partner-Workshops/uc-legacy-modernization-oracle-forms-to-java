package com.hrms.security;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Security Service Implementation
 *
 * Migrated from: PKG_SECURITY body
 *
 * Key security improvements over legacy:
 * - BCrypt password hashing instead of MD5 (fixes TD-001)
 * - Account lockout after 5 failed attempts with 30-minute auto-unlock (fixes TD-002)
 * - Stateless JWT tokens instead of database-stored sessions (ADR-003)
 */
@Service
public class SecurityServiceImpl implements SecurityService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 30;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SecurityServiceImpl(AuthenticationManager authenticationManager,
                               JwtTokenProvider tokenProvider,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public LoginResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        // Check if account is locked (fixes TD-002)
        if (user.isAccountLocked()) {
            if (user.getLockExpiryDate() != null
                    && user.getLockExpiryDate().isBefore(LocalDateTime.now())) {
                // Lock has expired — reset lockout state
                user.setAccountLocked(false);
                user.setFailedLoginAttempts(0);
                user.setLockExpiryDate(null);
                userRepository.save(user);
            } else {
                throw new LockedException(
                        "Account is locked due to too many failed login attempts. "
                        + "Please try again later.");
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(), request.password()));

            // Successful login — reset failed attempts
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }

            String token = tokenProvider.generateToken(authentication);

            HrmsUserDetails userDetails = (HrmsUserDetails) authentication.getPrincipal();
            Set<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(a -> a.startsWith("ROLE_"))
                    .map(a -> a.substring(5))
                    .collect(Collectors.toSet());

            return new LoginResponse(token, tokenProvider.getExpirationMs(),
                    userDetails.getUsername(), roles);

        } catch (AuthenticationException e) {
            // Increment failed login attempts
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setAccountLocked(true);
                user.setLockExpiryDate(
                        LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedDate(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
