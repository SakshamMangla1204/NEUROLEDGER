package com.neuroledger.gateway.data.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST

interface NeuroLedgerApi {
    @POST("abha/verify")
    suspend fun verifyIdentity(
        @Body payload: VerifyIdentityRequest
    ): VerifyIdentityResponse

    @POST("health-metrics")
    suspend fun postHealthMetrics(
        @Body payload: HealthMetricsRequest
    ): HealthMetricsResponse

    @POST("patients/{abhaId}/wearables/analyze")
    suspend fun analyzeLatestWearable(
        @Path("abhaId") abhaId: String
    ): AnalyzeWearableResponse

    @GET("patients/{abhaId}/dashboard")
    suspend fun getDashboard(
        @Path("abhaId") abhaId: String
    ): DashboardResponse

    @GET("system/status")
    suspend fun getSystemStatus(): SystemStatusResponse
}
