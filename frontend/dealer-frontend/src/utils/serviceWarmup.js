/**
 * Service Warm-up Utility
 * Pre-warms Render services to reduce cold start delays
 */

import { API_CONFIG } from '../api';

export const warmupServices = async () => {
  console.log("🔥 [ServiceWarmup] Starting service warm-up...");
  
  const warmupEndpoints = [
    {
      name: "Gateway Health",
      url: `${API_CONFIG.BASE_URL}/health`,
      timeout: 15000
    },
    {
      name: "Postings Service Health", 
      url: `${API_CONFIG.BASE_URL}/api/v1/health`,
      timeout: 30000
    },
    {
      name: "Dealer Service Health",
      url: `${API_CONFIG.DEALER_BASE_URL}/health`, 
      timeout: 30000
    }
  ];

  const warmupPromises = warmupEndpoints.map(async (endpoint) => {
    try {
      console.log(`🔥 [ServiceWarmup] Warming up: ${endpoint.name}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ [ServiceWarmup] ${endpoint.name} warmed up successfully`);
        return { name: endpoint.name, success: true };
      } else {
        console.warn(`⚠️ [ServiceWarmup] ${endpoint.name} returned ${response.status}`);
        return { name: endpoint.name, success: false, status: response.status };
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏰ [ServiceWarmup] ${endpoint.name} timed out during warmup`);
      } else {
        console.warn(`❌ [ServiceWarmup] ${endpoint.name} warmup failed:`, error.message);
      }
      return { name: endpoint.name, success: false, error: error.message };
    }
  });

  try {
    const results = await Promise.allSettled(warmupPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const total = warmupEndpoints.length;
    
    console.log(`🔥 [ServiceWarmup] Completed: ${successful}/${total} services warmed up`);
    return results;
  } catch (error) {
    console.error("🔥 [ServiceWarmup] Error during warmup:", error);
    return [];
  }
};

/**
 * Warm up services in the background when app loads
 */
export const backgroundWarmup = () => {
  // Delay warmup to not interfere with initial app loading
  setTimeout(() => {
    warmupServices().catch(error => {
      console.error("🔥 [ServiceWarmup] Background warmup failed:", error);
    });
  }, 2000); // Wait 2 seconds after app load
};
