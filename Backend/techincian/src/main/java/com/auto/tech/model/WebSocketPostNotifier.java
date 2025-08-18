package com.auto.tech.model;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketPostNotifier {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyPostAccepted(Long postId) {
        messagingTemplate.convertAndSend("/topic/post-accepted", postId);
    }
}