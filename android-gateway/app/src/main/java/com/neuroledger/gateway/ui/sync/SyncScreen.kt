package com.neuroledger.gateway.ui.sync

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.neuroledger.gateway.ui.theme.BackgroundWhite
import com.neuroledger.gateway.ui.theme.DeepNavy
import com.neuroledger.gateway.ui.theme.TextSecondary
import com.neuroledger.gateway.ui.theme.VerificationGreen
import com.neuroledger.gateway.ui.theme.RiskAmber
import com.neuroledger.gateway.viewmodel.SyncUiState

@Composable
fun SyncScreen(
    state: SyncUiState,
    permissions: Set<String>,
    permissionContract: androidx.activity.result.contract.ActivityResultContract<Set<String>, Set<String>>,
    onPermissionsResult: () -> Unit,
    onRefreshMetrics: () -> Unit,
    onSyncClick: () -> Unit
) {
    val permissionLauncher = rememberLauncherForActivityResult(permissionContract) {
        onPermissionsResult()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Sync",
            style = MaterialTheme.typography.headlineMedium,
            color = DeepNavy
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = BackgroundWhite),
            shape = MaterialTheme.shapes.large,
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Health Connect Permissions", style = MaterialTheme.typography.titleMedium)
                Text(state.healthConnectStatus, style = MaterialTheme.typography.bodyLarge)
                Text(
                    text = if (state.permissionsGranted) "Permission Granted" else "Permission Required",
                    color = if (state.permissionsGranted) VerificationGreen else RiskAmber
                )
                Button(
                    onClick = { permissionLauncher.launch(permissions) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Grant Health Connect Permissions")
                }
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = BackgroundWhite),
            shape = MaterialTheme.shapes.large,
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Latest Wearable Values", style = MaterialTheme.typography.titleMedium)
                MetricRow("Heart rate", "${state.metrics.heartRate} bpm")
                MetricRow("Steps", state.metrics.steps.toString())
                MetricRow("Sleep hours", String.format("%.1f", state.metrics.sleepHours))
                Button(onClick = onRefreshMetrics, modifier = Modifier.fillMaxWidth()) {
                    Text("Read Latest Health Connect Data")
                }
                Button(onClick = onSyncClick, modifier = Modifier.fillMaxWidth()) {
                    Text("SYNC WITH NEUROLEDGER")
                }
                if (state.isSyncing) {
                    CircularProgressIndicator()
                }
                state.errorMessage?.let {
                    Text(text = it, color = MaterialTheme.colorScheme.error)
                }
                Text(
                    text = "Designed to read Health Connect and hand off cleanly to the NeuroLedger backend.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun MetricRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge)
        Text(value, style = MaterialTheme.typography.titleMedium)
    }
}
