// WebSocketDealerNotifier.java
package com.auto.postings.webSocket;

import com.auto.postings.model.Posting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketDealerNotifier {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyNewPost(Posting post) {
        System.out.println("📡 Sending new post to technicians → " + post.getId());
        messagingTemplate.convertAndSend("/topic/new-post", post);
    }
}