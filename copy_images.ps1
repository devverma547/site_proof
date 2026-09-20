Add-Type -AssemblyName System.Drawing
$brainDir = "C:\Users\Lenovo\.gemini\antigravity-ide\brain\264cf23c-5c0c-4cd9-b534-fe67a7f62d35"
$projectDir = "c:\Users\Lenovo\Documents\vibe codding"
$previewDir = "$projectDir\public\design-preview"

if (!(Test-Path $previewDir)) {
    New-Item -ItemType Directory -Path $previewDir -Force | Out-Null
}

$images = Get-ChildItem $brainDir -Include '*.jpg','*.png' -Recurse
foreach ($item in $images) {
    Copy-Item $item.FullName -Destination "$previewDir\$($item.Name)" -Force
    try {
        $img = [System.Drawing.Image]::FromFile($item.FullName)
        Write-Output "$($item.Name): $($img.Width) x $($img.Height)"
        $img.Dispose()
    } catch {
        Write-Output "$($item.Name): Error loading image"
    }
}
