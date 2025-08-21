package com.autoinspect.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorsHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpResponse response = exchange.getResponse();
        HttpHeaders headers = response.getHeaders();
        
        System.out.println("🔧 [CorsHeaderFilter] Adding CORS headers to response");
        
        // Add CORS headers to all responses
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        headers.add("Access-Control-Allow-Headers", "*");
        headers.add("Access-Control-Allow-Credentials", "true");
        headers.add("Access-Control-Max-Age", "3600");
        
        System.out.println("🔧 [CorsHeaderFilter] CORS headers added: " + headers.get("Access-Control-Allow-Origin"));
        
        // Handle preflight requests
        if ("OPTIONS".equals(exchange.getRequest().getMethod().name())) {
            System.out.println("🔧 [CorsHeaderFilter] Handling OPTIONS preflight request");
            response.setRawStatusCode(200);
            return Mono.empty();
        }
        
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1; // Run after LoggingFilter
    }
}
