package com.neuroledger.gateway.services

import android.content.Context
import com.neuroledger.gateway.data.healthconnect.HealthConnectManager
import com.neuroledger.gateway.data.network.NeuroLedgerApi
import com.neuroledger.gateway.data.network.NetworkModule
import com.neuroledger.gateway.repository.IdentityRepository
import com.neuroledger.gateway.repository.SyncStatusRepository
import com.neuroledger.gateway.repository.WearableSyncRepository

class ServiceLocator(context: Context) {
    private val appContext = context.applicationContext
    private val sharedPreferences =
        appContext.getSharedPreferences("neuroledger_gateway", Context.MODE_PRIVATE)

    private val api: NeuroLedgerApi = NetworkModule.createApi()
    private val healthConnectManager = HealthConnectManager(appContext)
    private val identityRepository = IdentityRepository(sharedPreferences)
    private val syncStatusRepository = SyncStatusRepository(sharedPreferences)
    private val wearableSyncRepository = WearableSyncRepository(
        api = api,
        identityRepository = identityRepository,
        syncStatusRepository = syncStatusRepository,
        healthConnectManager = healthConnectManager
    )

    fun identityRepository(): IdentityRepository = identityRepository
    fun syncStatusRepository(): SyncStatusRepository = syncStatusRepository
    fun wearableSyncRepository(): WearableSyncRepository = wearableSyncRepository
}
