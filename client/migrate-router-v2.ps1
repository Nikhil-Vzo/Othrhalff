$files = Get-ChildItem -Path "c:\AntiGravity Projects\Othrhalff\client\src" -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $newContent = @()
    $changed = $false

    foreach ($line in $content) {
        if ($line -match "react-router-dom") {
            $changed = $true
            if ($line -match "Link") {
                $newContent += "import Link from 'next/link';"
            }
            if ($line -match "useNavigate|useLocation|useParams|useSearchParams") {
                $hooks = @()
                if ($line -match "useNavigate") { $hooks += "useRouter" }
                if ($line -match "useLocation") { $hooks += "usePathname" }
                if ($line -match "useParams") { $hooks += "useParams" }
                if ($line -match "useSearchParams") { $hooks += "useSearchParams" }
                
                $hookStr = $hooks -join ", "
                $newContent += "import { $hookStr } from 'next/navigation';"
            }
        }
        elseif ($line -match "useNavigate\(") {
            $newContent += ($line -replace "useNavigate\(", "useRouter(")
            $changed = $true
        }
        elseif ($line -match "navigate\(") {
            $newContent += ($line -replace "navigate\(", "router.push(")
            $changed = $true
        }
        elseif ($line -match "<Link to=") {
            $newContent += ($line -replace "<Link to=", "<Link href=")
            $changed = $true
        }
        else {
            $newContent += $line
        }
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Updated $($file.Name)"
    }
}
