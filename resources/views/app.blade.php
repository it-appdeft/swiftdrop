<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#65a30d">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" type="image/png" href="/brand/logo.png">
        <link rel="apple-touch-icon" href="/brand/logo.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @php
            // Mirror the namespaced page resolver in resources/js/app.tsx so the
            // Vite manifest lookup points at the same file the JS side imports.
            $component = $page['component'];
            $namespaces = [
                'web/' => 'resources/js/web/pages/',
                'customer/' => 'resources/js/customer/pages/',
                'restaurant/' => 'resources/js/restaurant/pages/',
            ];
            $pageEntry = null;
            foreach ($namespaces as $prefix => $base) {
                if (str_starts_with($component, $prefix)) {
                    $pageEntry = $base.substr($component, strlen($prefix)).'.tsx';
                    break;
                }
            }
            if (! $pageEntry) {
                // Unprefixed names: admin first, fall back to web (legacy `welcome` etc).
                $adminCandidate = 'resources/js/admin/pages/'.$component.'.tsx';
                $pageEntry = is_file(base_path($adminCandidate))
                    ? $adminCandidate
                    : 'resources/js/web/pages/'.$component.'.tsx';
            }
        @endphp
        @vite(['resources/js/app.tsx', $pageEntry])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
