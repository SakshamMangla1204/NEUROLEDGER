package com.neuroledger.gateway.viewmodel

import androidx.lifecycle.ViewModel
import com.neuroledger.gateway.repository.WearableSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class IdentityViewModel(
    private val repository: WearableSyncRepository
) : ViewModel() {
    private val _state = MutableStateFlow(
        IdentityUiState(
            abhaId = repository.savedAbhaId(),
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

    fun saveAbhaId() {
        repository.saveAbhaId(_state.value.abhaId)
        _state.value = _state.value.copy(
            abhaId = repository.savedAbhaId(),
            connectionStatus = "Saved locally and ready for sync"
        )
    }
}

data class IdentityUiState(
    val abhaId: String = "",
    val connectionStatus: String = "No ABHA ID saved yet"
)
