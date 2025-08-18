package com.auto.tech.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // 🔗 Register the STOMP endpoint for clients to connect
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")              // URL endpoint clients will hit
            .setAllowedOriginPatterns("*")   // CORS allowed from all origins (change this for production)
            .withSockJS();                   // Use SockJS fallback for browsers that don’t support WebSocket
    }

    // 📡 Configure messaging broker (topics, application prefix)
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");         // Enables a simple in-memory message broker for topics
        config.setApplicationDestinationPrefixes("/app"); // Prefix for messages bound for @MessageMapping (not used here, safe to keep)
    }
    
}