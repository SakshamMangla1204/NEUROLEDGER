package com.neuroledger.gateway.ui.status

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.neuroledger.gateway.repository.SyncStatus
import com.neuroledger.gateway.ui.theme.BackgroundWhite
import com.neuroledger.gateway.ui.theme.CriticalRed
import com.neuroledger.gateway.ui.theme.DeepNavy
import com.neuroledger.gateway.ui.theme.RiskAmber
import com.neuroledger.gateway.ui.theme.VerificationGreen

@Composable
fun StatusScreen(
    state: SyncStatus,
    onRefresh: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Status",
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
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Risk Level: ${state.riskLevel}",
                    style = MaterialTheme.typography.titleLarge,
                    color = when (state.riskLevel.uppercase()) {
                        "LOW" -> VerificationGreen
                        "MODERATE" -> RiskAmber
                        "HIGH" -> CriticalRed
                        else -> DeepNavy
                    }
                )
                Text("Last Synced: ${state.lastSynced}", style = MaterialTheme.typography.bodyLarge)
                Text(
                    "Status: ${state.uploadStatus}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (state.uploadStatus.uppercase() == "SUCCESS") {
                        VerificationGreen
                    } else {
                        DeepNavy
                    }
                )
                Button(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) {
                    Text("Refresh Status")
                }
            }
        }
    }
}
