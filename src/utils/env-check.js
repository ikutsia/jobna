// Check if environment variables are loaded
export function checkEnvironmentVariables() {
  const requiredVars = [
    "REACT_APP_FIREBASE_API_KEY",
    "REACT_APP_FIREBASE_AUTH_DOMAIN",
    "REACT_APP_FIREBASE_PROJECT_ID",
    "REACT_APP_FIREBASE_STORAGE_BUCKET",
    "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
    "REACT_APP_FIREBASE_APP_ID",
  ];

  const missingVars = [];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("❌ Missing environment variables:", missingVars);
    console.error(
      "Make sure you have created a .env file in your project root"
    );
    return false;
  } else {
    console.log("✅ All required environment variables are loaded");
    return true;
  }
}
