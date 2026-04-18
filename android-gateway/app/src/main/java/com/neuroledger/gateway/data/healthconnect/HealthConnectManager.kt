package com.neuroledger.gateway.data.healthconnect

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit

class HealthConnectManager(private val context: Context) {
    companion object {
        private const val PROVIDER_PACKAGE = "com.google.android.apps.healthdata"
    }

    val permissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class)
    )

    private fun clientOrNull(): HealthConnectClient? {
        return if (sdkStatus() == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }
    }

    fun sdkStatus(): Int {
        return HealthConnectClient.getSdkStatus(context, PROVIDER_PACKAGE)
    }

    suspend fun hasAllPermissions(): Boolean {
        val client = clientOrNull() ?: return false
        val granted = client.permissionController.getGrantedPermissions()
        return granted.containsAll(permissions)
    }

    fun permissionContract() = PermissionController.createRequestPermissionResultContract()

    suspend fun readLatestMetrics(): WearableMetrics {
        val client = clientOrNull() ?: throw IllegalStateException("Health Connect unavailable")

        val now = Instant.now()
        val start = now.minus(1, ChronoUnit.DAYS)
        val filter = TimeRangeFilter.between(start, now)

        val heartRateResponse = client.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = filter
            )
        )

        val latestHeartRate = heartRateResponse.records
            .flatMap { it.samples }
            .maxByOrNull { it.time }
            ?.beatsPerMinute
            ?.toInt() ?: 0

        val stepsAggregate = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = filter
            )
        )
        val steps = (stepsAggregate[StepsRecord.COUNT_TOTAL] ?: 0L).toInt()

        val sleepAggregate = client.aggregate(
            AggregateRequest(
                metrics = setOf(SleepSessionRecord.SLEEP_DURATION_TOTAL),
                timeRangeFilter = filter
            )
        )
        val sleepDuration = sleepAggregate[SleepSessionRecord.SLEEP_DURATION_TOTAL] ?: Duration.ZERO
        val sleepHours = sleepDuration.toMinutes() / 60.0

        return WearableMetrics(
            heartRate = latestHeartRate,
            steps = steps,
            sleepHours = sleepHours
        )
    }
}

data class WearableMetrics(
    val heartRate: Int = 0,
    val steps: Int = 0,
    val sleepHours: Double = 0.0
)
