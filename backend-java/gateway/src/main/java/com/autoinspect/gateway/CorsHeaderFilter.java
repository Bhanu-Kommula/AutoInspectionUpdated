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
        
        System.out.println("🔧 [CorsHeaderFilter] Processing request: " + exchange.getRequest().getMethod() + " " + exchange.getRequest().getURI());
        
        // NO SECURITY - Allow everything
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Access-Control-Allow-Methods", "*");
        headers.add("Access-Control-Allow-Headers", "*");
        headers.add("Access-Control-Allow-Credentials", "true");
        headers.add("Access-Control-Max-Age", "3600");
        headers.add("Access-Control-Expose-Headers", "*");
        
        // Handle preflight requests - NO SECURITY, just return 200
        if ("OPTIONS".equals(exchange.getRequest().getMethod().name())) {
            System.out.println("🔧 [CorsHeaderFilter] Handling OPTIONS preflight request - NO SECURITY, returning 200");
            response.setRawStatusCode(200);
            return Mono.empty();
        }
        
        System.out.println("🔧 [CorsHeaderFilter] CORS headers added, continuing with request");
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1; // Run after LoggingFilter
    }
}
