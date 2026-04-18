package com.neuroledger.gateway.viewmodel

import androidx.health.connect.client.HealthConnectClient
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neuroledger.gateway.data.healthconnect.WearableMetrics
import com.neuroledger.gateway.repository.WearableSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SyncViewModel(
    private val repository: WearableSyncRepository
) : ViewModel() {
    private val _state = MutableStateFlow(
        SyncUiState(
            permissionsGranted = false,
            healthConnectStatus = healthConnectText(repository.sdkStatus())
        )
    )
    val state: StateFlow<SyncUiState> = _state.asStateFlow()

    init {
        refreshPermissionStatus()
    }

    fun refreshPermissionStatus() {
        viewModelScope.launch {
            val granted = repository.hasAllPermissions()
            _state.value = _state.value.copy(
                permissionsGranted = granted,
                healthConnectStatus = healthConnectText(repository.sdkStatus())
            )
        }
    }

    fun onPermissionsResult() {
        refreshPermissionStatus()
    }

    fun loadLatestMetrics() {
        viewModelScope.launch {
            runCatching { repository.readLatestMetrics() }
                .onSuccess { metrics ->
                    _state.value = _state.value.copy(
                        metrics = metrics,
                        errorMessage = null
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(errorMessage = error.message)
                }
        }
    }

    fun syncWithNeuroLedger() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSyncing = true, errorMessage = null)
            runCatching { repository.syncWithBackend() }
                .onSuccess { result ->
                    _state.value = _state.value.copy(
                        isSyncing = false,
                        metrics = result.metrics,
                        lastRiskLevel = result.response.riskLevel,
                        lastSynced = result.status.lastSynced,
                        uploadStatus = result.status.uploadStatus
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isSyncing = false,
                        errorMessage = error.message ?: "Sync failed"
                    )
                }
        }
    }

    fun requiredPermissions() = repository.permissions()

    fun permissionContract() = repository.permissionContract()

    private fun healthConnectText(status: Int): String {
        return when (status) {
            HealthConnectClient.SDK_AVAILABLE -> "Health Connect available"
            HealthConnectClient.SDK_UNAVAILABLE -> "Health Connect unavailable on this device"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ->
                "Health Connect update required"
            else -> "Health Connect status unknown"
        }
    }
}

data class SyncUiState(
    val metrics: WearableMetrics = WearableMetrics(),
    val permissionsGranted: Boolean = false,
    val healthConnectStatus: String = "",
    val isSyncing: Boolean = false,
    val lastRiskLevel: String = "--",
    val lastSynced: String = "--",
    val uploadStatus: String = "IDLE",
    val errorMessage: String? = null
)
