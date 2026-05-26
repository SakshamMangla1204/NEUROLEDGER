package com.neuroledger.gateway.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neuroledger.gateway.repository.WearableSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class IdentityViewModel(
    private val repository: WearableSyncRepository
) : ViewModel() {
    private val _state = MutableStateFlow(
        IdentityUiState(
            abhaId = repository.savedAbhaId(),
            backendUrl = repository.savedBackendUrl(),
            connectionStatus = if (repository.hasConfiguredIdentity()) {
                "Identity saved locally"
            } else {
                "No ABHA ID saved yet"
            }
        )
    )
    val state: StateFlow<IdentityUiState> = _state.asStateFlow()

    fun onAbhaIdChanged(value: String) {
        _state.value = _state.value.copy(abhaId = value)
    }

    fun onBackendUrlChanged(value: String) {
        _state.value = _state.value.copy(backendUrl = value)
    }

    fun saveAbhaId() {
        repository.saveAbhaId(_state.value.abhaId)
        repository.saveBackendUrl(_state.value.backendUrl)
        _state.value = _state.value.copy(
            abhaId = repository.savedAbhaId(),
            backendUrl = repository.savedBackendUrl(),
            connectionStatus = "Saved locally and ready for sync"
        )
    }

    fun verifyIdentity() {
        repository.saveAbhaId(_state.value.abhaId)
        repository.saveBackendUrl(_state.value.backendUrl)
        _state.value = _state.value.copy(
            abhaId = repository.savedAbhaId(),
            backendUrl = repository.savedBackendUrl(),
            isVerifying = true,
            connectionStatus = "Checking NeuroLedger backend..."
        )

        viewModelScope.launch {
            runCatching { repository.verifySavedIdentity() }
                .onSuccess { label ->
                    _state.value = _state.value.copy(
                        isVerifying = false,
                        connectionStatus = "Verified: $label"
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(
                        isVerifying = false,
                        connectionStatus = error.message ?: "Identity verification failed"
                    )
                }
        }
    }
}

data class IdentityUiState(
    val abhaId: String = "",
    val backendUrl: String = "",
    val connectionStatus: String = "No ABHA ID saved yet",
    val isVerifying: Boolean = false
)
