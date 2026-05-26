package com.neuroledger.gateway.repository

import com.neuroledger.gateway.data.healthconnect.HealthConnectManager
import com.neuroledger.gateway.data.healthconnect.WearableMetrics
import com.neuroledger.gateway.data.network.HealthMetricsRequest
import com.neuroledger.gateway.data.network.HealthMetricsResponse
import com.neuroledger.gateway.data.network.NeuroLedgerApi
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

class WearableSyncRepository(
    private val api: NeuroLedgerApi,
    private val identityRepository: IdentityRepository,
    private val syncStatusRepository: SyncStatusRepository,
    private val healthConnectManager: HealthConnectManager
) {
    fun savedAbhaId(): String = identityRepository.getAbhaId()

    fun saveAbhaId(abhaId: String) = identityRepository.saveAbhaId(abhaId)

    fun savedBackendUrl(): String = identityRepository.getBackendUrl()

    fun saveBackendUrl(url: String) = identityRepository.saveBackendUrl(url)

    fun hasConfiguredIdentity(): Boolean = identityRepository.hasConfiguredIdentity()

    fun currentStatus(): SyncStatus = syncStatusRepository.read()

    fun sdkStatus(): Int = healthConnectManager.sdkStatus()

    fun permissions() = healthConnectManager.permissions

    fun permissionContract() = healthConnectManager.permissionContract()

    suspend fun hasAllPermissions(): Boolean = healthConnectManager.hasAllPermissions()

    suspend fun readLatestMetrics(): WearableMetrics = healthConnectManager.readLatestMetrics()

    suspend fun verifySavedIdentity(): String {
        val abhaId = identityRepository.getAbhaId()
        require(abhaId.isNotBlank()) { "Please save an ABHA ID first." }

        val response = api.verifyIdentity(com.neuroledger.gateway.data.network.VerifyIdentityRequest(abhaId))
        require(response.verified) { "ABHA ID was not verified by NeuroLedger." }
        return response.patient?.name ?: response.abhaId ?: abhaId
    }

    suspend fun syncWithBackend(): SyncResult {
        return syncMetrics(healthConnectManager.readLatestMetrics())
    }

    suspend fun syncDemoWithBackend(): SyncResult {
        return syncMetrics(
            WearableMetrics(
                heartRate = 78,
                steps = 6200,
                sleepHours = 7.1,
                glucose = 96
            )
        )
    }

    private suspend fun syncMetrics(metrics: WearableMetrics): SyncResult {
        val abhaId = identityRepository.getAbhaId()
        require(abhaId.isNotBlank()) { "Please save an ABHA ID first." }

        val response = api.postHealthMetrics(
            HealthMetricsRequest(
                abhaId = abhaId,
                heartRate = metrics.heartRate,
                steps = metrics.steps,
                sleepHours = metrics.sleepHours,
                glucose = metrics.glucose
            )
        )

        val prediction = runCatching { api.analyzeLatestWearable(abhaId).prediction }.getOrNull()
        val dashboard = runCatching { api.getDashboard(abhaId) }.getOrNull()
        val system = runCatching { api.getSystemStatus() }.getOrNull()
        val syncStatus = response.toSyncStatus(prediction, dashboard, system)
        syncStatusRepository.save(syncStatus)

        return SyncResult(
            metrics = metrics,
            response = response,
            status = syncStatus
        )
    }

    private fun HealthMetricsResponse.toSyncStatus(
        prediction: com.neuroledger.gateway.data.network.PredictionPayload?,
        dashboard: com.neuroledger.gateway.data.network.DashboardResponse?,
        system: com.neuroledger.gateway.data.network.SystemStatusResponse?
    ): SyncStatus {
        val totalReports = dashboard?.reportSummary?.totalReports ?: 0
        val anchoredReports = dashboard?.reportSummary?.anchoredReports ?: 0
        return SyncStatus(
            riskLevel = prediction?.riskLevel?.uppercase() ?: riskLevel,
            lastSynced = formatTimestamp(wearable.receivedAt),
            uploadStatus = "SUCCESS",
            mlScore = prediction?.overallScore?.toString() ?: "--",
            recommendation = prediction?.recommendation ?: "Synced. Run the web dashboard for full review.",
            blockchainStatus = system?.blockchain ?: if (dashboard?.blockchain?.verified == true) "connected" else "--",
            reportStatus = "$anchoredReports/$totalReports anchored",
            storageStatus = system?.storage ?: "--"
        )
    }

    private fun formatTimestamp(timestamp: String): String {
        return runCatching {
            OffsetDateTime.parse(timestamp).format(DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault()))
        }.getOrDefault(timestamp)
    }
}

data class SyncResult(
    val metrics: WearableMetrics,
    val response: HealthMetricsResponse,
    val status: SyncStatus
)
