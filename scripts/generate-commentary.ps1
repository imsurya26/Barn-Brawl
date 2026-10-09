# Original Barn Brawl lines; rendered offline using the installed Windows voice.
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Rate = 1
$lines = Get-Content -Raw -LiteralPath 'public/audio/commentary.json' | ConvertFrom-Json
foreach ($property in $lines.PSObject.Properties) {
 $index = 0
 foreach ($line in $property.Value) {
  $target = Join-Path (Get-Location) ("public/audio/" + $property.Name + "-" + $index + ".wav")
  $voice.SetOutputToWaveFile($target)
  $voice.Speak($line)
  $index++
 }
}
$voice.Dispose()
