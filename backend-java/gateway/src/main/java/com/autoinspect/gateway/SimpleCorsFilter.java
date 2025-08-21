package com.autoinspect.gateway;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SimpleCorsFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        System.out.println("🔧 [SimpleCorsFilter] Processing: " + request.getMethod() + " " + request.getRequestURI());
        
        // NO SECURITY - Add CORS headers to everything
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "*");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        // Handle OPTIONS preflight - return 200 immediately
        if ("OPTIONS".equals(request.getMethod())) {
            System.out.println("🔧 [SimpleCorsFilter] OPTIONS detected - returning 200 immediately");
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        
        System.out.println("🔧 [SimpleCorsFilter] Continuing with request");
        filterChain.doFilter(request, response);
    }
}
