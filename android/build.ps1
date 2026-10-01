$ErrorActionPreference = "Stop"

$SDK    = "$env:LOCALAPPDATA\Android\Sdk"
$BT     = "$SDK\build-tools\34.0.0"
$JDK    = "C:\Program Files\Android\Android Studio\jbr\bin"
$SDKJAR = "$SDK\platforms\android-34\android.jar"
$R8JAR  = "C:\Program Files\Android\Android Studio\plugins\android\lib\r8.jar"

$PROJ = $PSScriptRoot
$WORK = Join-Path $env:TEMP "tg_apk_build"
$OUT  = Join-Path $WORK "build"

if (Test-Path $WORK) { Remove-Item $WORK -Recurse -Force }
New-Item -ItemType Directory -Path $OUT | Out-Null
Copy-Item (Join-Path $PROJ "res") $WORK -Recurse
Copy-Item (Join-Path $PROJ "assets") $WORK -Recurse
Copy-Item (Join-Path $PROJ "java") $WORK -Recurse
Copy-Item (Join-Path $PROJ "AndroidManifest.xml") $WORK

Write-Host "[1/6] aapt2 compile"
& "$BT\aapt2.exe" compile --dir "$WORK\res" -o "$OUT\res.zip"

Write-Host "[2/6] aapt2 link"
& "$BT\aapt2.exe" link -o "$OUT\base.apk" -I "$SDKJAR" --manifest "$WORK\AndroidManifest.xml" -A "$WORK\assets" --min-sdk-version 24 --target-sdk-version 34 --version-code 2 --version-name 2.0 "$OUT\res.zip"

Write-Host "[3/6] javac"
New-Item -ItemType Directory -Path "$OUT\classes" | Out-Null
& "$JDK\javac.exe" --release 8 -nowarn -encoding UTF-8 -classpath "$SDKJAR" -d "$OUT\classes" (Join-Path $WORK "java\com\tailgram\app\MainActivity.java")

Write-Host "[4/6] d8"
New-Item -ItemType Directory -Path "$OUT\dex" | Out-Null
$cls = Get-ChildItem "$OUT\classes" -Recurse -Filter *.class | ForEach-Object { $_.FullName }
& "$JDK\java.exe" -cp $R8JAR com.android.tools.r8.D8 --lib $SDKJAR --min-api 24 --output "$OUT\dex" @cls

Write-Host "[5/6] zipalign + add dex"
Push-Location "$OUT\dex"
& "$BT\aapt.exe" add "$OUT\base.apk" "classes.dex" | Out-Null
Pop-Location
& "$BT\zipalign.exe" -f -p 4 "$OUT\base.apk" "$OUT\aligned.apk"

Write-Host "[6/6] apksigner"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "$BT\apksigner.bat" sign --ks (Join-Path $PROJ "keys\tailgram.keystore") --ks-pass pass:tailgram --key-pass pass:tailgram --ks-key-alias tailgram --v2-signing-enabled true --v3-signing-enabled true --out (Join-Path $PROJ "..\TailGram.apk") "$OUT\aligned.apk"

Write-Host "OK -> $(Join-Path $PROJ '..\TailGram.apk')"