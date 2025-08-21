package com.autoinspect.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        logger.info("🔍 [Gateway] Request: {} {} -> {}", 
            request.getMethod(), 
            request.getURI(), 
            request.getHeaders().getOrigin());
        
        // Log CORS headers
        logger.info("🔍 [Gateway] CORS Headers: Origin={}", 
            request.getHeaders().getOrigin());
        
        return chain.filter(exchange)
            .then(Mono.fromRunnable(() -> {
                logger.info("🔍 [Gateway] Response: {} {} -> Status: {}", 
                    request.getMethod(), 
                    request.getURI(), 
                    exchange.getResponse().getStatusCode());
            }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
