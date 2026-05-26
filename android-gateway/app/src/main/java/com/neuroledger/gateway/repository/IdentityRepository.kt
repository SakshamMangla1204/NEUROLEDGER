package com.neuroledger.gateway.repository

import android.content.SharedPreferences
import com.neuroledger.gateway.BuildConfig
import com.neuroledger.gateway.data.network.NetworkModule

class IdentityRepository(private val sharedPreferences: SharedPreferences) {
    companion object {
        private const val KEY_ABHA_ID = "abha_id"
    }

    fun saveAbhaId(abhaId: String) {
        sharedPreferences.edit().putString(KEY_ABHA_ID, abhaId.trim().uppercase()).apply()
    }

    fun getAbhaId(): String {
        return sharedPreferences.getString(KEY_ABHA_ID, "") ?: ""
    }

    fun hasConfiguredIdentity(): Boolean = getAbhaId().isNotBlank()

    fun saveBackendUrl(url: String) {
        val normalized = url.trim().ifBlank { BuildConfig.BASE_URL }
        val withTrailingSlash = if (normalized.endsWith("/")) normalized else "$normalized/"
        sharedPreferences.edit()
            .putString(NetworkModule.KEY_BACKEND_URL, withTrailingSlash)
            .apply()
    }

    fun getBackendUrl(): String {
        return sharedPreferences.getString(NetworkModule.KEY_BACKEND_URL, BuildConfig.BASE_URL)
            ?: BuildConfig.BASE_URL
    }
}
