package com.neuroledger.gateway.data.network

import com.google.gson.annotations.SerializedName

data class HealthMetricsRequest(
    @SerializedName("abha_id")
    val abhaId: String,
    @SerializedName("heart_rate")
    val heartRate: Int,
    val steps: Int,
    @SerializedName("sleep_hours")
    val sleepHours: Double
)

data class HealthMetricsResponse(
    @SerializedName("risk_level")
    val riskLevel: String,
    @SerializedName("risk_score")
    val riskScore: Int,
    val wearable: WearablePayload
)

data class WearablePayload(
    @SerializedName("received_at")
    val receivedAt: String
)
