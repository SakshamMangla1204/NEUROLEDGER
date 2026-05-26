# NeuroLedger Android Gateway

Minimal Android gateway app for:

`Smartwatch -> Health Connect -> NeuroLedger Android Gateway -> POST /api/health-metrics -> NeuroLedger backend`

## Tech

- Kotlin
- Material Design 3
- Health Connect SDK
- Retrofit
- Single activity
- MVVM

## Screens

1. `Identity`
2. `Sync`
3. `Status`

## What it does

- saves and verifies an ABHA-style identity against the NeuroLedger backend
- requests Health Connect permissions for heart rate, steps, and sleep
- reads latest Health Connect values when available
- provides a demo sync path for emulator/phones without wearable data
- posts metrics to `POST /api/health-metrics`
- triggers ML analysis after sync
- stores the latest risk, ML score, recommendation, blockchain, storage, and report status for the Status screen
- lets you edit the backend URL inside the app, so the same APK works for emulator and real phone demos

## Before testing

Start the NeuroLedger backend first:

```powershell
..\Start-NeuroLedgerDemo.bat
```

The Android gateway posts to:

`POST /api/health-metrics`

By default, debug builds use the Android emulator host address:

`http://10.0.2.2:5050/api/`

For a real phone on the same Wi-Fi, either edit the Backend URL on the Identity screen or pass your laptop IP when building:

```powershell
.\gradlew.bat assembleDebug -PNEUROLEDGER_BASE_URL=http://192.168.1.8:5050/api/
```

Replace `192.168.1.8` with your laptop's Wi-Fi IP.

You need a local JDK installed and `JAVA_HOME` configured before Gradle can build the app.

This repo can use Android Studio's bundled JDK automatically through:

```powershell
.\Build-AndroidGateway.bat
```

Install and launch on a connected emulator/device:

```powershell
.\Install-AndroidGateway.bat
```

Build for a real phone on the same Wi-Fi:

```powershell
.\Build-AndroidGateway.bat http://192.168.1.8:5050/api/
.\Install-AndroidGateway.bat
```
