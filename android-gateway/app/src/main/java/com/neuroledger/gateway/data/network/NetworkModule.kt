package com.neuroledger.gateway.data.network

import android.content.SharedPreferences
import com.neuroledger.gateway.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object NetworkModule {
    const val KEY_BACKEND_URL = "backend_url"

    fun createApi(sharedPreferences: SharedPreferences): NeuroLedgerApi {
        val logger = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val configuredUrl = sharedPreferences
                    .getString(KEY_BACKEND_URL, BuildConfig.BASE_URL)
                    ?: BuildConfig.BASE_URL
                val configuredBase = configuredUrl.toHttpUrlOrNull()
                val request = chain.request()

                if (configuredBase == null) {
                    chain.proceed(request)
                } else {
                    val rewrittenUrl = request.url.newBuilder()
                        .scheme(configuredBase.scheme)
                        .host(configuredBase.host)
                        .port(configuredBase.port)
                        .build()
                    chain.proceed(request.newBuilder().url(rewrittenUrl).build())
                }
            }
            .addInterceptor(logger)
            .build()

        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(NeuroLedgerApi::class.java)
    }
}
