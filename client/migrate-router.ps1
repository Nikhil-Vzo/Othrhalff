$files = Get-ChildItem -Path "c:\AntiGravity Projects\Othrhalff\client\src" -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    $changed = $false

    # Import replacement
    if ($content -match "react-router-dom") {
        # This is a basic replacement, might need manual touch-ups for complex destructurings
        $content = $content -replace "import \{.*useNavigate.*\} from 'react-router-dom';", "import { useRouter } from 'next/navigation';"
        $content = $content -replace "import \{.*Link.*\} from 'react-router-dom';", "import Link from 'next/link';"
        $content = $content -replace "import \{.*useParams.*\} from 'react-router-dom';", "import { useParams } from 'next/navigation';"
        $content = $content -replace "import \{.*useLocation.*\} from 'react-router-dom';", "import { usePathname } from 'next/navigation';"
        $content = $content -replace "import \{.*Navigate.*\} from 'react-router-dom';", "import { redirect as Navigate } from 'next/navigation';"
        # Fallback for remaining ones
        $content = $content -replace "import \{ (.*) \} from 'react-router-dom';", "import { `$1 } from 'next/navigation';"
        $changed = $true
    }

    if ($content -match "useNavigate") {
        $content = $content -replace "useNavigate", "useRouter"
        $changed = $true
    }

    if ($content -match "navigate\(") {
        $content = $content -replace "navigate\(", "router.push("
        $changed = $true
    }

    if ($content -match "<Link to=") {
        $content = $content -replace "<Link to=", "<Link href="
        $changed = $true
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}
