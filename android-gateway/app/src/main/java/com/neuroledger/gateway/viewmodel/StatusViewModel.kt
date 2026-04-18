package com.neuroledger.gateway.viewmodel

import androidx.lifecycle.ViewModel
import com.neuroledger.gateway.repository.SyncStatus
import com.neuroledger.gateway.repository.SyncStatusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class StatusViewModel(
    private val repository: SyncStatusRepository
) : ViewModel() {
    private val _state = MutableStateFlow(repository.read())
    val state: StateFlow<SyncStatus> = _state.asStateFlow()

    fun refresh() {
        _state.value = repository.read()
    }
}
