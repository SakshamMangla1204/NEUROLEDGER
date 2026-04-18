package com.neuroledger.gateway

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.neuroledger.gateway.services.ServiceLocator
import com.neuroledger.gateway.ui.NeuroLedgerGatewayApp
import com.neuroledger.gateway.ui.theme.NeuroLedgerGatewayTheme

class MainActivity : ComponentActivity() {
    private lateinit var serviceLocator: ServiceLocator

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        serviceLocator = ServiceLocator(applicationContext)

        setContent {
            NeuroLedgerGatewayTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NeuroLedgerGatewayApp(serviceLocator = serviceLocator)
                }
            }
        }
    }
}
