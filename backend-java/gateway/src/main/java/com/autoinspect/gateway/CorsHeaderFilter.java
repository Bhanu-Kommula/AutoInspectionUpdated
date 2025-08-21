package com.autoinspect.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
// import org.springframework.stereotype.Component; - Disabled
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

// @Component - Disabled in favor of CorsWebFilter in CorsConfig
public class CorsHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpResponse response = exchange.getResponse();
        HttpHeaders headers = response.getHeaders();
        
        System.out.println("🔧 [CorsHeaderFilter] Processing: " + exchange.getRequest().getMethod() + " " + exchange.getRequest().getURI());
        
        // NO SECURITY - Add CORS headers to everything
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
        headers.add("Access-Control-Allow-Headers", "Origin,Content-Type,Accept,Authorization,X-Requested-With");
        headers.add("Access-Control-Max-Age", "3600");
        
        // Handle OPTIONS - just return 200
        if ("OPTIONS".equals(exchange.getRequest().getMethod().name())) {
            System.out.println("🔧 [CorsHeaderFilter] OPTIONS detected - returning 200 immediately");
            response.setRawStatusCode(200);
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
