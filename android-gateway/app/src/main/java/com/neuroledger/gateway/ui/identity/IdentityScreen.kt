package com.neuroledger.gateway.ui.identity

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.neuroledger.gateway.ui.theme.BackgroundWhite
import com.neuroledger.gateway.ui.theme.DeepNavy
import com.neuroledger.gateway.ui.theme.TextSecondary
import com.neuroledger.gateway.viewmodel.IdentityUiState

@Composable
fun IdentityScreen(
    state: IdentityUiState,
    onAbhaIdChange: (String) -> Unit,
    onBackendUrlChange: (String) -> Unit,
    onSaveClick: () -> Unit,
    onVerifyClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "NeuroLedger Gateway",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = DeepNavy
        )
        Text(
            text = "Connect this phone to the local NeuroLedger demo backend.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = BackgroundWhite),
            shape = MaterialTheme.shapes.medium,
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
                Text("Backend URL", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = state.backendUrl,
                    onValueChange = onBackendUrlChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("http://10.0.2.2:5050/api/") },
                    singleLine = true
                )
                Button(onClick = onSaveClick, modifier = Modifier.fillMaxWidth()) {
                    Text("Save")
                }
                OutlinedButton(onClick = onVerifyClick, modifier = Modifier.fillMaxWidth()) {
                    Text("Verify With NeuroLedger")
                }
                if (state.isVerifying) {
                    CircularProgressIndicator()
                }
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = BackgroundWhite),
            shape = MaterialTheme.shapes.medium,
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
                    text = "Use 10.0.2.2 for Android emulator. Use your laptop Wi-Fi IP for a real phone.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}
