package com.neuroledger.gateway.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.neuroledger.gateway.services.ServiceLocator
import com.neuroledger.gateway.ui.identity.IdentityScreen
import com.neuroledger.gateway.ui.status.StatusScreen
import com.neuroledger.gateway.ui.sync.SyncScreen
import com.neuroledger.gateway.viewmodel.IdentityViewModel
import com.neuroledger.gateway.viewmodel.StatusViewModel
import com.neuroledger.gateway.viewmodel.SyncViewModel

@Composable
fun NeuroLedgerGatewayApp(serviceLocator: ServiceLocator) {
    val navController = rememberNavController()
    val identityViewModel: IdentityViewModel = viewModel(
        factory = GatewayViewModelFactory {
            IdentityViewModel(serviceLocator.wearableSyncRepository())
        }
    )
    val syncViewModel: SyncViewModel = viewModel(
        factory = GatewayViewModelFactory {
            SyncViewModel(serviceLocator.wearableSyncRepository())
        }
    )
    val statusViewModel: StatusViewModel = viewModel(
        factory = GatewayViewModelFactory {
            StatusViewModel(serviceLocator.syncStatusRepository())
        }
    )

    val items = remember {
        listOf(
            GatewayDestination.Identity,
            GatewayDestination.Sync,
            GatewayDestination.Status
        )
    }
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar {
                items.forEach { destination ->
                    NavigationBarItem(
                        selected = currentDestination?.hierarchy?.any { it.route == destination.route } == true,
                        onClick = {
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = destination.icon,
                                contentDescription = destination.label
                            )
                        },
                        label = { Text(destination.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = GatewayDestination.Identity.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(GatewayDestination.Identity.route) {
                val state by identityViewModel.state.collectAsStateWithLifecycle()
                IdentityScreen(
                    state = state,
                    onAbhaIdChange = identityViewModel::onAbhaIdChanged,
                    onSaveClick = identityViewModel::saveAbhaId
                )
            }
            composable(GatewayDestination.Sync.route) {
                val state by syncViewModel.state.collectAsStateWithLifecycle()
                SyncScreen(
                    state = state,
                    permissions = syncViewModel.requiredPermissions(),
                    permissionContract = syncViewModel.permissionContract(),
                    onPermissionsResult = syncViewModel::onPermissionsResult,
                    onRefreshMetrics = syncViewModel::loadLatestMetrics,
                    onSyncClick = {
                        syncViewModel.syncWithNeuroLedger()
                        statusViewModel.refresh()
                    }
                )
            }
            composable(GatewayDestination.Status.route) {
                val state by statusViewModel.state.collectAsStateWithLifecycle()
                StatusScreen(
                    state = state,
                    onRefresh = statusViewModel::refresh
                )
            }
        }
    }
}

sealed class GatewayDestination(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    data object Identity : GatewayDestination("identity", "Identity", Icons.Default.Person)
    data object Sync : GatewayDestination("sync", "Sync", Icons.Default.Sync)
    data object Status : GatewayDestination("status", "Status", Icons.Default.Badge)
}
