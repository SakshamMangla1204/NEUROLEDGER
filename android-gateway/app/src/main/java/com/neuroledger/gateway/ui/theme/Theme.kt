package com.neuroledger.gateway.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val AppColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    secondary = DeepNavy,
    tertiary = TealSignal,
    background = BackgroundWhite,
    surface = SurfaceWhite,
    onPrimary = BackgroundWhite,
    onBackground = TextDark,
    onSurface = TextDark,
    error = CriticalRed
)

private val AppShapes = Shapes(
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp)
)

@Composable
fun NeuroLedgerGatewayTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography = Typography(),
        shapes = AppShapes,
        content = content
    )
}
