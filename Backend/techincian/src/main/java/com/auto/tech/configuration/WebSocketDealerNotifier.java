package com.auto.tech.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import com.auto.tech.dto.PostingDTO;

@Component
public class WebSocketDealerNotifier {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyDealerPostUpdated(PostingDTO post) {
        messagingTemplate.convertAndSend("/topic/dealer-update", post); // 🔁 full object now
    }
}