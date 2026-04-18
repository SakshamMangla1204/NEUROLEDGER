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

## Before testing

Update the placeholder backend URL in:

`app/build.gradle.kts`

Replace:

`http://YOUR_LOCAL_IP:3000/api/`

With your laptop IP on the same Wi-Fi, for example:

`http://192.168.1.8:3000/api/`

Also make sure your NeuroLedger backend is reachable on that port and path.
