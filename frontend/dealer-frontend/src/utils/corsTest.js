// CORS Testing Utility
// This file helps test CORS configuration during development

export const testCorsConnection = async () => {
  const tests = [
    {
      name: "Gateway Health Check",
      url: "https://api-gateway.onrender.com/health",
      method: "GET"
    },
    {
      name: "Gateway CORS Test",
      url: "https://api-gateway.onrender.com/health/cors-test",
      method: "GET"
    },
    {
      name: "Dealer Registration Endpoint",
      url: "https://api-gateway.onrender.com/api/dealers/register",
      method: "OPTIONS"
    },
    {
      name: "Direct Dealer Service (if accessible)",
      url: "https://dealer-service.onrender.com/api/dealers/register",
      method: "OPTIONS"
    }
  ];

  console.log("🧪 Starting CORS tests...");
  
  for (const test of tests) {
    try {
      console.log(`🔧 Testing: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });
      
      console.log(`✅ ${test.name}: ${response.status} ${response.statusText}`);
      console.log(`   CORS Headers:`, {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      });
      
    } catch (error) {
      console.error(`❌ ${test.name}: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("🧪 CORS tests completed");
};

export const testDealerRegistration = async (testData) => {
  console.log("🧪 Testing dealer registration with CORS...");
  
  try {
    // First test OPTIONS
    const optionsResponse = await fetch("https://api-gateway.onrender.com/api/dealers/register", {
      method: "OPTIONS",
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log("✅ OPTIONS Request:", optionsResponse.status, optionsResponse.statusText);
    console.log("   CORS Headers:", {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
    });
    
    if (optionsResponse.ok) {
      // Now test actual POST
      const postResponse = await fetch("https://api-gateway.onrender.com/api/dealers/register", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(testData)
      });
      
      console.log("✅ POST Request:", postResponse.status, postResponse.statusText);
      const responseData = await postResponse.text();
      console.log("   Response:", responseData);
      
      return { success: true, data: responseData };
    }
    
  } catch (error) {
    console.error("❌ Dealer registration test failed:", error);
    return { success: false, error: error.message };
  }
};
