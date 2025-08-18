// Quick test script to verify user detection is working
// You can run this in the browser console to test

export const testUserDetection = () => {
  console.log("🧪 === USER DETECTION TEST ===");

  // Test the same logic as GlobalCallManager
  let userEmail = null;
  let userType = null;

  // Check for dealer info first
  const dealerInfo = localStorage.getItem("dealerInfo");
  console.log("🧪 dealerInfo:", dealerInfo);

  if (dealerInfo) {
    try {
      const parsed = JSON.parse(dealerInfo);
      console.log("🧪 parsed dealerInfo:", parsed);
      if (parsed.email) {
        userEmail = parsed.email;
        userType = "DEALER";
      }
    } catch (error) {
      console.error("Error parsing dealer info:", error);
    }
  }

  // Check for technician info if no dealer found
  if (!userEmail) {
    const technicianSessionId = sessionStorage.getItem(
      "currentTechnicianSession"
    );
    console.log("🧪 technicianSessionId:", technicianSessionId);

    if (technicianSessionId) {
      const technicianKey = `technicianInfo_${technicianSessionId}`;
      const technicianData = sessionStorage.getItem(technicianKey);
      console.log("🧪 technicianData:", technicianData);

      if (technicianData) {
        try {
          const parsed = JSON.parse(technicianData);
          console.log("🧪 parsed technicianData:", parsed);
          if (parsed.email) {
            userEmail = parsed.email;
            userType = "TECHNICIAN";
          }
        } catch (error) {
          console.error("Error parsing technician info:", error);
        }
      }
    }
  }

  console.log("🧪 RESULT:", { userEmail, userType });
  console.log("🧪 === END TEST ===");

  return { userEmail, userType };
};

// Auto-run if in browser
if (typeof window !== "undefined") {
  window.testUserDetection = testUserDetection;
  console.log("✅ Test function available as window.testUserDetection()");
}
