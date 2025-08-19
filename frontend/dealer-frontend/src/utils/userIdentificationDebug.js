/**
 * User Identification Debug Utility
 * Helps debug user identification issues for global calls
 */

export const debugUserIdentification = () => {
  console.log("🔍 === USER IDENTIFICATION DEBUG ===");

  // Check technician data in sessionStorage
  const technicianSessionId = sessionStorage.getItem(
    "currentTechnicianSession"
  );
  console.log("🔍 Technician Session ID:", technicianSessionId);

  if (technicianSessionId) {
    const technicianKey = `technicianInfo_${technicianSessionId}`;
    const technicianData = sessionStorage.getItem(technicianKey);
    console.log("🔍 Technician Data Raw:", technicianData);

    if (technicianData) {
      try {
        const parsed = JSON.parse(technicianData);
        console.log("🔍 Technician Email:", parsed.email);
        console.log("🔍 Technician Name:", parsed.name);
      } catch (error) {
        console.error("❌ Error parsing technician data:", error);
      }
    }
  }

  // Check dealer data in localStorage
  const dealerInfo = localStorage.getItem("dealerInfo");
  console.log("🔍 Dealer Info Raw:", dealerInfo);

  if (dealerInfo) {
    try {
      const parsed = JSON.parse(dealerInfo);
      console.log("🔍 Dealer Email:", parsed.email);
      console.log("🔍 Dealer Name:", parsed.name);
    } catch (error) {
      console.error("❌ Error parsing dealer data:", error);
    }
  }

  // Check fallback currentUser
  const currentUser = localStorage.getItem("currentUser");
  console.log("🔍 Current User Fallback:", currentUser);

  console.log("🔍 === END DEBUG ===");
};

export const getCurrentUserEmail = () => {
  // Same logic as in App.js
  try {
    // Check for technician data in sessionStorage first
    const technicianSessionId = sessionStorage.getItem(
      "currentTechnicianSession"
    );
    if (technicianSessionId) {
      const technicianKey = `technicianInfo_${technicianSessionId}`;
      const technicianData = sessionStorage.getItem(technicianKey);
      if (technicianData) {
        const parsed = JSON.parse(technicianData);
        if (parsed.email) {
          return parsed.email;
        }
      }
    }

    // Check for dealer info in localStorage
    const dealerInfo = localStorage.getItem("dealerInfo");
    if (dealerInfo) {
      const parsed = JSON.parse(dealerInfo);
      if (parsed.email) {
        return parsed.email;
      }
    }

    // Fallback to currentUser
    return localStorage.getItem("currentUser") || "Guest";
  } catch (error) {
    console.error("Error getting current user email:", error);
    return "Guest";
  }
};

// Add to window for easy console debugging
if (typeof window !== "undefined") {
  window.debugUserIdentification = debugUserIdentification;
  window.getCurrentUserEmail = getCurrentUserEmail;
}
