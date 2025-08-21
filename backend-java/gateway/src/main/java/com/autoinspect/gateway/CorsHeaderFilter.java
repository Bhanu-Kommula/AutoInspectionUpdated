package com.autoinspect.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorsHeaderFilter implements GlobalFilter, Ordered {

    @Value("${frontend.origin:https://dealer-frontend-iwor.onrender.com}")
    private String allowedOrigin;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpResponse response = exchange.getResponse();
        HttpHeaders headers = response.getHeaders();
        
        String origin = exchange.getRequest().getHeaders().getFirst("Origin");
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();
        
        System.out.println("🔧 [CorsHeaderFilter] Processing: " + method + " " + path);
        System.out.println("🔧 [CorsHeaderFilter] Origin: " + origin);
        
        // Set CORS headers for all responses - use configured origin to prevent conflicts
        headers.set("Access-Control-Allow-Origin", allowedOrigin);
        headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        headers.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With, Cache-Control");
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Access-Control-Max-Age", "3600");
        
        System.out.println("🔧 [CorsHeaderFilter] Setting CORS origin: " + allowedOrigin);
        
        // Handle OPTIONS preflight request
        if ("OPTIONS".equals(method)) {
            System.out.println("🔧 [CorsHeaderFilter] OPTIONS preflight detected - returning 200 immediately");
            response.setStatusCode(HttpStatus.OK);
            return Mono.empty();
        }
        
        System.out.println("🔧 [CorsHeaderFilter] Continuing with request");
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
