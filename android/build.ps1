$ErrorActionPreference = "Stop"

function Step([string]$name, [scriptblock]$block) {
    Write-Host "[$name]..."
    & $block
    if ($LASTEXITCODE -ne 0) { throw "Step '$name' failed with exit code $LASTEXITCODE" }
}

$SDK    = "$env:LOCALAPPDATA\Android\Sdk"
$BT     = "$SDK\build-tools\34.0.0"
$JDK    = "C:\Program Files\Android\Android Studio\jbr\bin"
$SDKJAR = "$SDK\platforms\android-34\android.jar"
$R8JAR  = "C:\Program Files\Android\Android Studio\plugins\android\lib\r8.jar"

$PROJ = $PSScriptRoot
$WORK = Join-Path $env:TEMP "tg_apk_build"
$OUT  = Join-Path $WORK "build"

$VER_CODE = 15
$VER_NAME = "3.3"

if (Test-Path $WORK) { Remove-Item $WORK -Recurse -Force }
New-Item -ItemType Directory -Path $OUT | Out-Null
Copy-Item (Join-Path $PROJ "res") $WORK -Recurse
Copy-Item (Join-Path $PROJ "assets") $WORK -Recurse
Copy-Item (Join-Path $PROJ "java") $WORK -Recurse
Copy-Item (Join-Path $PROJ "AndroidManifest.xml") $WORK

Step "1/6 aapt2 compile" { & "$BT\aapt2.exe" compile --dir "$WORK\res" -o "$OUT\res.zip" }

Step "2/6 aapt2 link" {
    & "$BT\aapt2.exe" link -o "$OUT\base.apk" -I "$SDKJAR" --manifest "$WORK\AndroidManifest.xml" `
        -A "$WORK\assets" --min-sdk-version 24 --target-sdk-version 34 `
        --version-code $VER_CODE --version-name $VER_NAME "$OUT\res.zip"
}

New-Item -ItemType Directory -Path "$OUT\classes" | Out-Null
Step "3/6 javac" {
    & "$JDK\javac.exe" --release 8 -nowarn -encoding UTF-8 -classpath "$SDKJAR" `
        -d "$OUT\classes" @(Get-ChildItem (Join-Path $WORK "java") -Recurse -Filter *.java | ForEach-Object { $_.FullName })
}
if (-not (Get-ChildItem "$OUT\classes" -Recurse -Filter *.class)) { throw "javac produced no class files" }

New-Item -ItemType Directory -Path "$OUT\dex" | Out-Null
$cls = @(Get-ChildItem "$OUT\classes" -Recurse -Filter *.class | ForEach-Object { $_.FullName })
Step "4/6 d8" { & "$JDK\java.exe" -cp $R8JAR com.android.tools.r8.D8 --lib $SDKJAR --min-api 24 --output "$OUT\dex" @cls }
if (-not (Test-Path "$OUT\dex\classes.dex")) { throw "d8 produced no classes.dex" }

Step "5/6 aapt add + zipalign" {
    Push-Location "$OUT\dex"
    try { & "$BT\aapt.exe" add "$OUT\base.apk" "classes.dex" } finally { Pop-Location }
    & "$BT\zipalign.exe" -f -p 4 "$OUT\base.apk" "$OUT\aligned.apk"
}

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$APK = Join-Path $PROJ "..\TailGram.apk"
Step "6/6 apksigner" {
    & "$BT\apksigner.bat" sign --ks (Join-Path $PROJ "keys\tailgram.keystore") `
        --ks-pass pass:tailgram --key-pass pass:tailgram --ks-key-alias tailgram `
        --v2-signing-enabled true --v3-signing-enabled true `
        --out $APK "$OUT\aligned.apk"
}

Remove-Item (Join-Path $PROJ "..\TailGram.apk.idsig") -Force -ErrorAction SilentlyContinue

# Verify: signature + required entries inside the APK
Add-Type -AssemblyName System.IO.Compression.FileSystem
$chk = [System.IO.Compression.ZipFile]::OpenRead($APK)
try {
    $names = $chk.Entries | ForEach-Object { $_.FullName }
    foreach ($need in @("classes.dex", "AndroidManifest.xml", "assets/index.html", "assets/app.js", "assets/logo.png")) {
        if ($names -notcontains $need) { throw "APK is missing $need" }
    }
    $html = $null
    $e = $chk.GetEntry("assets/index.html")
    $rd = New-Object System.IO.StreamReader($e.Open(), [System.Text.Encoding]::UTF8)
    $html = $rd.ReadToEnd(); $rd.Close()
    if ($html -notmatch 'width=device-width') { throw "APK index.html has unexpected viewport meta" }
    if ($html -notmatch "html\.android-app \.back-btn") { throw "APK index.html is missing android single-pane CSS" }
    if ($html -notmatch "TailGramAndroid") { throw "APK index.html is missing UA-based android detection" }
} finally { $chk.Dispose() }
& "$BT\apksigner.bat" verify $APK
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed" }

Write-Host "OK -> $APK  ($([math]::Round((Get-Item $APK).Length/1KB)) KB)"