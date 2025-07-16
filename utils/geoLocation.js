import axios from "axios";

export async function getLocationFromIP(ip) {
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`);
    if (res.data.city && res.data.country_name) {
      return `${res.data.city}, ${res.data.country_name}`;
    } else {
      return "Unknown Location";
    }
  } catch {
    return "Unknown Location";
  }
}
