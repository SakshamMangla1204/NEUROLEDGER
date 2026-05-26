package com.neuroledger.gateway.data.network

import com.google.gson.annotations.SerializedName

data class VerifyIdentityRequest(
    val abhaId: String
)

data class VerifyIdentityResponse(
    val verified: Boolean,
    val abhaId: String? = null,
    val patient: PatientPayload? = null
)

data class PatientPayload(
    val name: String? = null
)

data class HealthMetricsRequest(
    @SerializedName("abha_id")
    val abhaId: String,
    @SerializedName("heart_rate")
    val heartRate: Int,
    val steps: Int,
    @SerializedName("sleep_hours")
    val sleepHours: Double,
    val glucose: Int
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

data class AnalyzeWearableResponse(
    val prediction: PredictionPayload? = null
)

data class PredictionPayload(
    @SerializedName("overall_score")
    val overallScore: Int? = null,
    @SerializedName("risk_level")
    val riskLevel: String? = null,
    val recommendation: String? = null,
    @SerializedName("doctor_review_required")
    val doctorReviewRequired: Boolean? = null
)

data class DashboardResponse(
    val reportSummary: ReportSummaryPayload? = null,
    val blockchain: BlockchainPayload? = null
)

data class ReportSummaryPayload(
    val totalReports: Int? = null,
    val anchoredReports: Int? = null
)

data class BlockchainPayload(
    val verified: Boolean? = null
)

data class SystemStatusResponse(
    val blockchain: String? = null,
    @SerializedName("ml_engine")
    val mlEngine: String? = null,
    val storage: String? = null,
    @SerializedName("wearable_ingestion")
    val wearableIngestion: String? = null
)
