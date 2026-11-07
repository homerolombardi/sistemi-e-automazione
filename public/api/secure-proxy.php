<?php
// Proxy Seguro - Sistemi e Automazione (Compatível com Mod_Security)
error_reporting(0);

$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';

if (!empty($referer) && strpos($referer, $host) === false && strpos($referer, 'localhost') === false) {
    http_response_code(403);
    die('Acesso externo bloqueado pela politica de seguranca.');
}

$encoded = isset($_GET['k']) ? $_GET['k'] : (isset($_GET['token']) ? $_GET['token'] : '');
$mode = isset($_GET['m']) ? $_GET['m'] : (isset($_GET['mode']) ? $_GET['mode'] : 'download');
$customFilename = isset($_GET['name']) ? preg_replace('/[^a-zA-Z0-9._-]/', '_', $_GET['name']) : '';

if (empty($encoded)) {
    http_response_code(400);
    die('Chave ausente.');
}

// Decodifica chave Hexadecimal Invertida
$url = '';
if (ctype_xdigit($encoded) && strlen($encoded) % 2 === 0) {
    $reversedHex = strrev($encoded);
    $url = rawurldecode(hex2bin($reversedHex));
} else {
    $url = base64_decode(strtr($encoded, '-_', '+/'));
}

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    die('Endereco invalido.');
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/pdf,*/*;q=0.8',
    'Accept-Language: it-IT,it;q=0.9,pt-BR;q=0.8,en-US;q=0.7',
    'Cache-Control: no-cache',
    'Upgrade-Insecure-Requests: 1'
));

$data = curl_exec($ch);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 400 || $data === false) {
    if ($mode === 'page') {
        header('Location: ' . $url);
        exit;
    }
    http_response_code(404);
    die('Conteudo indisponivel no momento.');
}

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: private, no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');

if ($mode === 'page') {
    header('Content-Type: text/html; charset=UTF-8');
    $parsed = parse_url($url);
    $baseUrl = $parsed['scheme'] . '://' . $parsed['host'] . (isset($parsed['path']) ? rtrim(dirname($parsed['path']), '/') . '/' : '/');

    $shieldScript = '
    <base href="' . htmlspecialchars($baseUrl, ENT_QUOTES) . '">
    <style>
      * { -webkit-user-select: none !important; user-select: none !important; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; user-select: text !important; }
    </style>
    <script>
      document.addEventListener("contextmenu", function(e){ e.preventDefault(); });
      document.addEventListener("dragstart", function(e){ e.preventDefault(); });
      document.addEventListener("keydown", function(e){
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && ["I","i","J","j","C","c"].includes(e.key)) ||
          (e.ctrlKey && ["U","u","S","s","P","p"].includes(e.key))
        ) {
          e.preventDefault();
          return false;
        }
      });
    </script>';

    if (stripos($data, '<head>') !== false) {
        $data = preg_replace('/<head>/i', '<head>' . $shieldScript, $data, 1);
    } else {
        $data = $shieldScript . $data;
    }
    echo $data;
    exit;
}

if ($mode === 'pdf') {
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="documento-protetto.pdf"');
    echo $data;
    exit;
}

$pathPart = parse_url($url, PHP_URL_PATH);
$ext = pathinfo($pathPart, PHP_URL_EXTENSION);
if (empty($customFilename)) {
    $customFilename = basename($pathPart);
} elseif (!empty($ext) && stripos($customFilename, '.' . $ext) === false) {
    $customFilename .= '.' . $ext;
}

header('Content-Type: ' . ($contentType ? $contentType : 'application/octet-stream'));
header('Content-Disposition: attachment; filename="' . $customFilename . '"');
header('Content-Length: ' . strlen($data));
echo $data;
exit;