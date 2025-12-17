// src/config.js
// Change this boolean to 'true' when you deploy!
const IS_LIVE = false;

export const API_BASE_URL = IS_LIVE 
  ? "https://your-backend-name.onrender.com" // You will get this URL in Phase 2
  : "http://localhost:5000";