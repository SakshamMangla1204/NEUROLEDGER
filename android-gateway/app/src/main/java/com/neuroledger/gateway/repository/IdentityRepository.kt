package com.neuroledger.gateway.repository

import android.content.SharedPreferences

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
}
