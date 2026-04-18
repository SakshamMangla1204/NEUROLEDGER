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

    fun hasConfiguredIdentity(): Boolean = identityRepository.hasConfiguredIdentity()

    fun currentStatus(): SyncStatus = syncStatusRepository.read()

    fun sdkStatus(): Int = healthConnectManager.sdkStatus()

    fun permissions() = healthConnectManager.permissions

    fun permissionContract() = healthConnectManager.permissionContract()

    suspend fun hasAllPermissions(): Boolean = healthConnectManager.hasAllPermissions()

    suspend fun readLatestMetrics(): WearableMetrics = healthConnectManager.readLatestMetrics()

    suspend fun syncWithBackend(): SyncResult {
        val abhaId = identityRepository.getAbhaId()
        require(abhaId.isNotBlank()) { "Please save an ABHA ID first." }

        val metrics = healthConnectManager.readLatestMetrics()
        val response = api.postHealthMetrics(
            HealthMetricsRequest(
                abhaId = abhaId,
                heartRate = metrics.heartRate,
                steps = metrics.steps,
                sleepHours = metrics.sleepHours
            )
        )

        val syncStatus = response.toSyncStatus()
        syncStatusRepository.save(syncStatus)

        return SyncResult(
            metrics = metrics,
            response = response,
            status = syncStatus
        )
    }

    private fun HealthMetricsResponse.toSyncStatus(): SyncStatus {
        return SyncStatus(
            riskLevel = riskLevel,
            lastSynced = formatTimestamp(wearable.receivedAt),
            uploadStatus = "SUCCESS"
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
