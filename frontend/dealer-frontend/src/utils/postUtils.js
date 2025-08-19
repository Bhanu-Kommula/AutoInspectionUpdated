// Utility functions for post management
export function capitalize(str) {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str) {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

// Filter posts in the frontend
export function filterPosts(posts, filters) {
  return posts.filter((p) => {
    if (
      filters.status &&
      filters.status !== "ALL" &&
      p.status !== filters.status
    )
      return false;
    if (filters.location && p.location !== filters.location) return false;
    if (filters.offerAmount && p.offerAmount !== filters.offerAmount)
      return false;
    if (filters.vin && p.vin !== filters.vin) return false;
    if (filters.auctionLot && p.auctionLot !== filters.auctionLot) return false;
    // Add more fields as needed
    return true;
  });
}

// Post icons array
export const postIcons = ["🛞", "🔧", "🚘", "🧰", "🛠️", "⛽", "🪛", "🚙", "🧑‍🔧"];
