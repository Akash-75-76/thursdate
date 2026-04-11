# Capacitor Mobile Setup (React + Vite)

## Install & Initialize

```bash
npm install
npx cap init "Thursdate" "com.thursdate.app" --web-dir=dist
npm install @capacitor/android @capacitor/ios
npm install @capacitor/camera @capacitor/filesystem
```

## Add Platforms

```bash
npx cap add android
npx cap add ios
```

## Build + Sync

```bash
npm run build:mobile
```

## Open Native Projects

```bash
npm run cap:open:android
npm run cap:open:ios
```

## Env Configuration

Use `.env.production` for release builds:

```env
VITE_BACKEND_API_URL=https://sundate-backend.onrender.com/api
```

For LAN testing (real device + local backend), set:

```env
VITE_BACKEND_API_URL=http://<your-local-ip>:5000/api
```

## Routing Note

The app keeps `BrowserRouter` and includes a catch-all route fallback (`* -> /`) to avoid dead routes in mobile WebView navigation.

## Icons & Splash

1. Place `icon.png` and `splash.png` in `resources/`
2. Run `npm run cap:assets`
3. Run `npm run cap:sync`

## Permissions Configured

- Android: Internet, Camera, Microphone, media read, coarse/fine location
- iOS: Camera, Microphone, Photo Library (read/write), Location when in use

## Build Artifacts

- Android APK/AAB: Build from Android Studio (`Build > Generate Signed Bundle / APK`)
- iOS IPA: Archive from Xcode (`Product > Archive`)

> iOS archive/signing requires macOS + Xcode.
