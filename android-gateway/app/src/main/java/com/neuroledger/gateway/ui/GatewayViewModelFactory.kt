package com.neuroledger.gateway.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

class GatewayViewModelFactory<T : ViewModel>(
    private val creator: () -> T
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return creator() as T
    }
}
