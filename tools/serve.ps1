# Servidor local mínimo para testar o service worker (http://localhost:PORT/).
# Rotas de teste: /__bump simula uma versão nova do sw.js; /__quit encerra.
param([int]$Port = 8765)

$root = Split-Path -Parent $PSScriptRoot
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'; '.json' = 'application/json'; '.md' = 'text/plain; charset=utf-8'
}
$bump = 0
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    $res = $ctx.Response
    $res.Headers.Add('Cache-Control', 'no-store')
    $bytes = $null
    if ($path -eq '/__quit') { $bytes = [Text.Encoding]::UTF8.GetBytes('bye'); $res.OutputStream.Write($bytes, 0, $bytes.Length); $res.Close(); break }
    if ($path -eq '/__bump') { $bump++; $bytes = [Text.Encoding]::UTF8.GetBytes("bump $bump") }
    elseif ($path -eq '/__result') {
      $reader = New-Object IO.StreamReader($ctx.Request.InputStream, [Text.Encoding]::UTF8)
      [IO.File]::WriteAllText((Join-Path $root '.update-result.txt'), $reader.ReadToEnd(), (New-Object Text.UTF8Encoding($false)))
      $bytes = [Text.Encoding]::UTF8.GetBytes('ok')
    }
    else {
      if ($path.EndsWith('/')) { $path += 'index.html' }
      $file = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
      if ((Test-Path $file -PathType Leaf) -and ((Resolve-Path $file).Path.StartsWith($root))) {
        $bytes = [IO.File]::ReadAllBytes($file)
        if ($path -eq '/sw.js' -and $bump -gt 0) { $bytes = $bytes + [Text.Encoding]::UTF8.GetBytes("`n// bump $bump`n") }
        $ext = [IO.Path]::GetExtension($file)
        if ($types.ContainsKey($ext)) { $res.ContentType = $types[$ext] }
      } else { $res.StatusCode = 404; $bytes = [Text.Encoding]::UTF8.GetBytes('not found') }
    }
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.Close()
  }
} finally { $listener.Stop() }
