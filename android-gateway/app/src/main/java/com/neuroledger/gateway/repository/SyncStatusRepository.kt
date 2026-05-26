package com.neuroledger.gateway.repository

import android.content.SharedPreferences

class SyncStatusRepository(private val sharedPreferences: SharedPreferences) {
    companion object {
        private const val KEY_RISK_LEVEL = "risk_level"
        private const val KEY_LAST_SYNCED = "last_synced"
        private const val KEY_STATUS = "sync_status"
        private const val KEY_ML_SCORE = "ml_score"
        private const val KEY_RECOMMENDATION = "recommendation"
        private const val KEY_BLOCKCHAIN = "blockchain"
        private const val KEY_REPORTS = "reports"
        private const val KEY_STORAGE = "storage"
    }

    fun save(status: SyncStatus) {
        sharedPreferences.edit()
            .putString(KEY_RISK_LEVEL, status.riskLevel)
            .putString(KEY_LAST_SYNCED, status.lastSynced)
            .putString(KEY_STATUS, status.uploadStatus)
            .putString(KEY_ML_SCORE, status.mlScore)
            .putString(KEY_RECOMMENDATION, status.recommendation)
            .putString(KEY_BLOCKCHAIN, status.blockchainStatus)
            .putString(KEY_REPORTS, status.reportStatus)
            .putString(KEY_STORAGE, status.storageStatus)
            .apply()
    }

    fun read(): SyncStatus {
        return SyncStatus(
            riskLevel = sharedPreferences.getString(KEY_RISK_LEVEL, "NOT_SYNCED") ?: "NOT_SYNCED",
            lastSynced = sharedPreferences.getString(KEY_LAST_SYNCED, "--") ?: "--",
            uploadStatus = sharedPreferences.getString(KEY_STATUS, "IDLE") ?: "IDLE",
            mlScore = sharedPreferences.getString(KEY_ML_SCORE, "--") ?: "--",
            recommendation = sharedPreferences.getString(KEY_RECOMMENDATION, "--") ?: "--",
            blockchainStatus = sharedPreferences.getString(KEY_BLOCKCHAIN, "--") ?: "--",
            reportStatus = sharedPreferences.getString(KEY_REPORTS, "--") ?: "--",
            storageStatus = sharedPreferences.getString(KEY_STORAGE, "--") ?: "--"
        )
    }
}

data class SyncStatus(
    val riskLevel: String = "NOT_SYNCED",
    val lastSynced: String = "--",
    val uploadStatus: String = "IDLE",
    val mlScore: String = "--",
    val recommendation: String = "--",
    val blockchainStatus: String = "--",
    val reportStatus: String = "--",
    val storageStatus: String = "--"
)
