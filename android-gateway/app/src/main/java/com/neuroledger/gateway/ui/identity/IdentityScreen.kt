package com.neuroledger.gateway.ui.identity

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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.neuroledger.gateway.ui.theme.BackgroundWhite
import com.neuroledger.gateway.ui.theme.DeepNavy
import com.neuroledger.gateway.ui.theme.TextSecondary
import com.neuroledger.gateway.viewmodel.IdentityUiState

@Composable
fun IdentityScreen(
    state: IdentityUiState,
    onAbhaIdChange: (String) -> Unit,
    onSaveClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Identity",
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
                Text("ABHA ID", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = state.abhaId,
                    onValueChange = onAbhaIdChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("SAKSHAM@ABDM") },
                    singleLine = true
                )
                Button(onClick = onSaveClick, modifier = Modifier.fillMaxWidth()) {
                    Text("Save")
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
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Connection Status", style = MaterialTheme.typography.titleMedium)
                Text(
                    text = state.connectionStatus,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Gateway will attach this ABHA ID to every sync request.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}
