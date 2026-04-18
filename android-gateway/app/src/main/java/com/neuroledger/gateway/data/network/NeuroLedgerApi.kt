package com.neuroledger.gateway.data.network

import retrofit2.http.Body
import retrofit2.http.POST

interface NeuroLedgerApi {
    @POST("health-metrics")
    suspend fun postHealthMetrics(
        @Body payload: HealthMetricsRequest
    ): HealthMetricsResponse
}
