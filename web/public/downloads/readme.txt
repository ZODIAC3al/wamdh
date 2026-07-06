How to configure download link for production:
1. Build the production Android APK using EAS CLI:
   eas build --platform android --profile production
2. Download the resulting .apk file from your Expo dashboard.
3. Rename the downloaded file to 'wamdh.apk' and copy it to this directory (web/public/downloads/wamdh.apk).
4. Deploy the updated Next.js marketing site to Vercel.
