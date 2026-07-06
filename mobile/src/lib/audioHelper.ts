import { Platform } from "react-native";

let ExpoAudio: any = null;
let hasNativeAudio = false;

try {
  // Safe require check to prevent ExponentAV crash on uncompiled native binaries
  const AV = require("expo-av");
  if (AV && AV.Audio) {
    ExpoAudio = AV.Audio;
    hasNativeAudio = true;
  }
} catch (e: any) {
  console.log("Native ExponentAV module is not compiled or available. Emulating voice notes. Error details:", e?.message || e);
}

export { ExpoAudio, hasNativeAudio };
