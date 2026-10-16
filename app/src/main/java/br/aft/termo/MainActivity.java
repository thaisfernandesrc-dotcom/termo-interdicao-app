package br.aft.termo;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Abre o app web (copiado para assets/www no build) num WebView, sem internet.
 * A página é servida em https://appassets.androidplatform.net para que localStorage
 * e o canvas da assinatura funcionem como no navegador.
 */
public class MainActivity extends Activity {
    private static final String INICIO = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String VOLTAR_JS = "(function(){var e=document.getElementById('etapa2');"
            + "if(e&&!e.hidden){document.getElementById('voltar').click();return 1}return 0})()";

    private WebView web;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient()); // habilita confirm() e alert()
        web.addJavascriptInterface(new Ponte(), "Android");
        setContentView(web);
        web.loadUrl(INICIO);
    }

    /** Na tela de assinatura, "voltar" retorna ao formulário em vez de fechar o app. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript(VOLTAR_JS, v -> { if (!"1".equals(v)) finish(); });
    }

    /** Chamada pelo app.js: modo 0 = baixar, 1 = compartilhar, 2 = abrir. */
    private class Ponte {
        @JavascriptInterface
        public String salvar(String base64, String nome, int modo) {
            try {
                byte[] pdf = Base64.decode(base64, Base64.DEFAULT);
                if (modo == 0) {
                    ContentResolver cr = getContentResolver();
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.MediaColumns.DISPLAY_NAME, nome);
                    cv.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                    cv.put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/Termos");
                    Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) return "não foi possível criar o arquivo em Downloads";
                    try (OutputStream out = cr.openOutputStream(uri)) { out.write(pdf); }
                    return "ok";
                }
                File pasta = new File(getCacheDir(), "pdf");
                pasta.mkdirs();
                File arq = new File(pasta, nome);
                try (OutputStream out = new FileOutputStream(arq)) { out.write(pdf); }
                Uri uri = FileProvider.getUriForFile(MainActivity.this, "br.aft.termo.files", arq);
                Intent i;
                if (modo == 1) {
                    i = Intent.createChooser(new Intent(Intent.ACTION_SEND)
                            .setType("application/pdf")
                            .putExtra(Intent.EXTRA_STREAM, uri)
                            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION), "Enviar termo");
                } else {
                    i = new Intent(Intent.ACTION_VIEW)
                            .setDataAndType(uri, "application/pdf")
                            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
                startActivity(i);
                return "ok";
            } catch (Exception e) {
                return e.toString();
            }
        }
    }
}
