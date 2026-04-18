package com.neuroledger.gateway.repository

import android.content.SharedPreferences

class SyncStatusRepository(private val sharedPreferences: SharedPreferences) {
    companion object {
        private const val KEY_RISK_LEVEL = "risk_level"
        private const val KEY_LAST_SYNCED = "last_synced"
        private const val KEY_STATUS = "sync_status"
    }

    fun save(status: SyncStatus) {
        sharedPreferences.edit()
            .putString(KEY_RISK_LEVEL, status.riskLevel)
            .putString(KEY_LAST_SYNCED, status.lastSynced)
            .putString(KEY_STATUS, status.uploadStatus)
            .apply()
    }

    fun read(): SyncStatus {
        return SyncStatus(
            riskLevel = sharedPreferences.getString(KEY_RISK_LEVEL, "NOT_SYNCED") ?: "NOT_SYNCED",
            lastSynced = sharedPreferences.getString(KEY_LAST_SYNCED, "--") ?: "--",
            uploadStatus = sharedPreferences.getString(KEY_STATUS, "IDLE") ?: "IDLE"
        )
    }
}

data class SyncStatus(
    val riskLevel: String = "NOT_SYNCED",
    val lastSynced: String = "--",
    val uploadStatus: String = "IDLE"
)
